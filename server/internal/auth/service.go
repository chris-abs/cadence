package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/family"
	"github.com/chris-abs/cadence/server/internal/middleware"
	"github.com/chris-abs/cadence/server/internal/models"
	"github.com/chris-abs/cadence/server/internal/platform/db"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
	"github.com/chris-abs/cadence/server/internal/profile"
)

var ErrUnknownFamily = errors.New("no family has that email")

type Deps struct {
	Pool         *pgxpool.Pool
	Repo         *Repository
	Families     *family.Service
	Profiles     *profile.Service
	Hasher       passhash.Hasher
	Now          func() time.Time
	Log          *slog.Logger
	Registration RegistrationMode
}

type Service struct {
	Deps
	loginPerIP      *middleware.RateLimiter
	loginPerEmail   *middleware.RateLimiter
	registerPerIP   *middleware.RateLimiter
	selectPerDevice *middleware.RateLimiter
	dummyHash       string
}

func NewService(d Deps) (*Service, error) {
	if !d.Registration.Valid() {
		return nil, fmt.Errorf("auth: invalid registration mode %q", d.Registration)
	}
	// Compared against for unknown emails, so they cost the same bcrypt time as a wrong password.
	dummy, err := d.Hasher.Hash("timing-equalisation-only")
	if err != nil {
		return nil, fmt.Errorf("auth: hash dummy password: %w", err)
	}
	return &Service{
		Deps:            d,
		loginPerIP:      middleware.NewRateLimiter(30*time.Second, 5, d.Now),
		loginPerEmail:   middleware.NewRateLimiter(90*time.Second, 10, d.Now),
		registerPerIP:   middleware.NewRateLimiter(20*time.Minute, 3, d.Now),
		selectPerDevice: middleware.NewRateLimiter(2*time.Second, 30, d.Now),
		dummyHash:       dummy,
	}, nil
}

func (s *Service) audit(ctx context.Context, event string, attrs ...slog.Attr) {
	middleware.Audit(ctx, s.Log, event, attrs...)
}

func (s *Service) rateLimited(ctx context.Context, limit string, wait time.Duration, attrs ...slog.Attr) error {
	s.audit(ctx, "auth.rate_limited", append([]slog.Attr{slog.String("limit", limit)}, attrs...)...)
	return &models.RetryError{After: wait}
}

func (s *Service) RegistrationOpen(ctx context.Context) (bool, error) {
	switch s.Registration {
	case RegistrationOpen:
		return true, nil
	case RegistrationClosed:
		return false, nil
	}
	exists, err := s.Families.Exists(ctx)
	return !exists, err
}

func (s *Service) Register(ctx context.Context, in RegisterInput) (SignedIn, error) {
	if s.Registration == RegistrationClosed {
		return SignedIn{}, models.ErrRegistrationClosed
	}
	if ok, wait := s.registerPerIP.Allow(in.ClientIP); !ok {
		return SignedIn{}, s.rateLimited(ctx, "register_per_ip", wait)
	}
	fe := models.FieldErrors{}
	email, msg := models.NormalizeEmail(in.Email)
	fe.Add("email", msg)
	fe.Add("password", checkPassword(in.Password))
	familyName, msg := family.NormalizeName(in.FamilyName)
	fe.Add("familyName", msg)
	ownerName := profile.ValidateDisplay(fe, "owner.", in.OwnerName, in.OwnerColour, in.OwnerAvatar, in.OwnerTimezone)
	deviceName, msg := normalizeDeviceName(in.DeviceName)
	fe.Add("deviceName", msg)
	if err := fe.Err(); err != nil {
		return SignedIn{}, err
	}
	hash, err := s.Hasher.Hash(in.Password)
	if err != nil {
		return SignedIn{}, err
	}
	familyID, err := models.NewID()
	if err != nil {
		return SignedIn{}, err
	}
	ownerID, err := models.NewID()
	if err != nil {
		return SignedIn{}, err
	}

	var out SignedIn
	var fsID, psID uuid.UUID
	var expires time.Time
	err = db.InTx(ctx, s.Pool, func(tx pgx.Tx) error {
		repo, families, profiles := NewRepository(tx), family.NewRepository(tx), profile.NewRepository(tx)
		if err := repo.lockRegistration(ctx); err != nil {
			return err
		}
		if s.Registration == RegistrationFirst {
			exists, err := families.Exists(ctx)
			if err != nil {
				return err
			}
			if exists {
				return models.ErrRegistrationClosed
			}
		}
		if err := s.dropDevice(ctx, repo, in.CurrentDeviceToken); err != nil {
			return err
		}
		if _, err := families.Create(ctx, family.NewFamily{ID: familyID, Name: familyName, Email: email, PasswordHash: hash}); err != nil {
			return err
		}
		if _, err := profiles.Create(ctx, profile.NewProfile{
			ID: ownerID, FamilyID: familyID, Name: ownerName, Role: models.Parent, IsOwner: true,
			Colour: in.OwnerColour, Avatar: in.OwnerAvatar, Timezone: in.OwnerTimezone,
		}); err != nil {
			return err
		}
		if out.FamilyToken, fsID, err = s.createFamilySession(ctx, repo, familyID, deviceName, in.UserAgent); err != nil {
			return err
		}
		out.ProfileToken, psID, expires, err = s.createProfileSession(ctx, repo, fsID, familyID, ownerID)
		return err
	})
	if err != nil {
		return SignedIn{}, err
	}
	out.Caller, err = s.caller(ctx, callerRow{familyID: familyID, device: fsID, session: psID, profile: ownerID,
		role: models.Parent, owner: true, timezone: in.OwnerTimezone, expires: expires})
	if err != nil {
		return SignedIn{}, err
	}
	s.audit(ctx, "family.registered", middleware.FamilyAttr(familyID), middleware.ProfileAttr(ownerID), middleware.SessionAttr(fsID))
	return out, nil
}

func (s *Service) Login(ctx context.Context, in LoginInput) (LoggedIn, error) {
	if ok, wait := s.loginPerIP.Allow(in.ClientIP); !ok {
		return LoggedIn{}, s.rateLimited(ctx, "login_per_ip", wait)
	}
	fe := models.FieldErrors{}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	switch {
	case email == "":
		fe.Add("email", "Enter your email address.")
	case len(email) > models.MaxEmailLength:
		fe.Add("email", "Use at most 254 characters.")
	}
	switch {
	case in.Password == "":
		fe.Add("password", "Enter your password.")
	case utf8.RuneCountInString(in.Password) > maxPasswordChars:
		fe.Add("password", "Use at most 72 characters.")
	}
	deviceName, msg := normalizeDeviceName(in.DeviceName)
	fe.Add("deviceName", msg)
	if err := fe.Err(); err != nil {
		return LoggedIn{}, err
	}
	if ok, wait := s.loginPerEmail.Check(email); !ok {
		return LoggedIn{}, s.rateLimited(ctx, "login_per_email", wait)
	}
	f, reason, err := s.checkCredentials(ctx, email, in.Password)
	if err != nil {
		return LoggedIn{}, err
	}
	if reason != "" {
		s.loginPerEmail.Fail(email)
		s.audit(ctx, "auth.login_failed", slog.String("reason", reason))
		return LoggedIn{}, models.ErrInvalidCredentials
	}
	out := LoggedIn{Family: f}
	var fsID uuid.UUID
	err = db.InTx(ctx, s.Pool, func(tx pgx.Tx) error {
		repo := NewRepository(tx)
		if err := s.dropDevice(ctx, repo, in.CurrentDeviceToken); err != nil {
			return err
		}
		out.Token, fsID, err = s.createFamilySession(ctx, repo, f.ID, deviceName, in.UserAgent)
		return err
	})
	if err != nil {
		return LoggedIn{}, err
	}
	if out.Profiles, err = s.Profiles.List(ctx, f.ID); err != nil {
		return LoggedIn{}, err
	}
	s.audit(ctx, "auth.login_succeeded", middleware.FamilyAttr(f.ID), middleware.SessionAttr(fsID))
	return out, nil
}

func (s *Service) checkCredentials(ctx context.Context, email, password string) (family.Family, string, error) {
	f, err := s.Families.FindByEmail(ctx, email)
	if errors.Is(err, models.ErrNotFound) {
		if _, err := s.Hasher.Matches(s.dummyHash, password); err != nil {
			return family.Family{}, "", err
		}
		return family.Family{}, "unknown_email", nil
	}
	if err != nil {
		return family.Family{}, "", err
	}
	if len(password) > maxPasswordBytes {
		if _, err := s.Hasher.Matches(s.dummyHash, ""); err != nil {
			return family.Family{}, "", err
		}
		return family.Family{}, "bad_password", nil
	}
	ok, err := s.Hasher.Matches(f.PasswordHash, password)
	if err != nil {
		return family.Family{}, "", err
	}
	if !ok {
		return family.Family{}, "bad_password", nil
	}
	return f, "", nil
}

func (s *Service) dropDevice(ctx context.Context, repo *Repository, token string) error {
	hash, ok := hashToken(token)
	if !ok {
		return nil
	}
	rows, err := repo.deleteDeviceByToken(ctx, hash)
	if err != nil {
		return err
	}
	for _, r := range rows {
		s.audit(ctx, "auth.logout", middleware.FamilyAttr(r.FamilyID), middleware.SessionAttr(r.ID), slog.String("reason", "replaced"))
	}
	return nil
}

func (s *Service) Logout(ctx context.Context, token string) error {
	return s.dropDevice(ctx, s.Repo, token)
}

func (s *Service) Lock(ctx context.Context, device models.Device) error {
	return s.Repo.deleteDeviceProfileSession(ctx, device.SessionID)
}

func (s *Service) FamilySession(ctx context.Context, device models.Device) (family.Family, []profile.Profile, error) {
	f, err := s.Families.Find(ctx, device.FamilyID)
	if err != nil {
		return family.Family{}, nil, err
	}
	profiles, err := s.Profiles.List(ctx, device.FamilyID)
	return f, profiles, err
}

func (s *Service) SelectProfile(ctx context.Context, device models.Device, profileID uuid.UUID, pin *string) (SignedIn, error) {
	if ok, wait := s.selectPerDevice.Allow(device.SessionID.String()); !ok {
		return SignedIn{}, s.rateLimited(ctx, "select_per_device", wait, middleware.FamilyAttr(device.FamilyID), middleware.SessionAttr(device.SessionID))
	}
	p, err := s.Profiles.Unlock(ctx, device.FamilyID, profileID, pin)
	if err != nil {
		return SignedIn{}, err
	}
	var out SignedIn
	var psID uuid.UUID
	var expires time.Time
	err = db.InTx(ctx, s.Pool, func(tx pgx.Tx) error {
		out.ProfileToken, psID, expires, err = s.createProfileSession(ctx, NewRepository(tx), device.SessionID, device.FamilyID, p.ID)
		return err
	})
	if err != nil {
		return SignedIn{}, err
	}
	out.Caller, err = s.caller(ctx, callerRow{familyID: device.FamilyID, device: device.SessionID, session: psID, profile: p.ID,
		role: p.Role, owner: p.IsOwner, timezone: p.Timezone, expires: expires})
	if err != nil {
		return SignedIn{}, err
	}
	s.audit(ctx, "profile.selected", middleware.FamilyAttr(device.FamilyID), middleware.ProfileAttr(p.ID), middleware.SessionAttr(psID))
	return out, nil
}

func (s *Service) Me(ctx context.Context, caller models.Caller) (Me, error) {
	p, err := s.Profiles.Get(ctx, caller, caller.ProfileID)
	if err != nil {
		return Me{}, err
	}
	f, err := s.Families.Find(ctx, caller.FamilyID)
	if err != nil {
		return Me{}, err
	}
	advised, err := s.Profiles.PinAdvised(ctx, p)
	if err != nil {
		return Me{}, err
	}
	return Me{Caller: caller, Profile: p, Family: f, PinAdvised: advised}, nil
}

func (s *Service) newSession() (uuid.UUID, string, []byte, error) {
	id, err := models.NewID()
	if err != nil {
		return uuid.UUID{}, "", nil, err
	}
	raw := make([]byte, tokenBytes)
	if _, err := io.ReadFull(rand.Reader, raw); err != nil {
		return uuid.UUID{}, "", nil, fmt.Errorf("read random token: %w", err)
	}
	sum := sha256.Sum256(raw)
	return id, base64.RawURLEncoding.EncodeToString(raw), sum[:], nil
}

func hashToken(token string) ([]byte, bool) {
	if base64.RawURLEncoding.DecodedLen(len(token)) != tokenBytes {
		return nil, false
	}
	raw, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil || len(raw) != tokenBytes {
		return nil, false
	}
	sum := sha256.Sum256(raw)
	return sum[:], true
}

func (s *Service) createFamilySession(ctx context.Context, repo *Repository, familyID uuid.UUID, deviceName *string, userAgent string) (string, uuid.UUID, error) {
	id, token, hash, err := s.newSession()
	if err != nil {
		return "", uuid.UUID{}, err
	}
	now := s.Now()
	err = repo.createSession(ctx, newSession{
		id: id, familyID: familyID, hash: hash, kind: kindFamily,
		deviceName: deviceName, userAgent: truncateUserAgent(userAgent),
		now: now, idle: now.Add(FamilyIdleTimeout), expires: now.Add(FamilyAbsoluteTimeout),
	})
	return token, id, err
}

func (s *Service) createProfileSession(ctx context.Context, repo *Repository, device, familyID, profileID uuid.UUID) (string, uuid.UUID, time.Time, error) {
	if err := repo.deleteDeviceProfileSession(ctx, device); err != nil {
		return "", uuid.UUID{}, time.Time{}, err
	}
	id, token, hash, err := s.newSession()
	if err != nil {
		return "", uuid.UUID{}, time.Time{}, err
	}
	now := s.Now()
	expires := now.Add(ProfileAbsoluteTimeout)
	err = repo.createSession(ctx, newSession{
		id: id, familyID: familyID, hash: hash, kind: kindProfile, profileID: &profileID, familySessID: &device,
		now: now, idle: now.Add(ProfileIdleTimeout), expires: expires,
	})
	return token, id, expires, err
}

func (s *Service) renew(ctx context.Context, w window, idle time.Duration, passive bool) error {
	now := s.Now()
	if passive || now.Sub(w.lastSeen) < renewEvery {
		return nil
	}
	next := now.Add(idle)
	if next.After(w.absolute) {
		next = w.absolute
	}
	return s.Repo.touch(ctx, w.id, now, next)
}

func (s *Service) expire(ctx context.Context, id uuid.UUID, reason error) error {
	if err := s.Repo.deleteSession(ctx, id); err != nil {
		return err
	}
	return reason
}

func (s *Service) AuthenticateDevice(ctx context.Context, token string, passive bool) (models.Device, error) {
	hash, ok := hashToken(token)
	if !ok {
		return models.Device{}, models.ErrFamilySessionRequired
	}
	row, err := s.Repo.familySession(ctx, hash)
	if err != nil {
		return models.Device{}, err
	}
	w := window{id: row.ID, lastSeen: row.LastSeenAt, idle: row.IdleExpiresAt, absolute: row.ExpiresAt}
	if w.expired(s.Now()) {
		return models.Device{}, s.expire(ctx, w.id, models.ErrFamilySessionRequired)
	}
	if err := s.renew(ctx, w, FamilyIdleTimeout, passive); err != nil {
		return models.Device{}, err
	}
	return models.Device{SessionID: row.ID, FamilyID: row.FamilyID}, nil
}

func (s *Service) AuthenticateProfile(ctx context.Context, familyToken, profileToken string, passive bool) (models.Caller, error) {
	fsHash, ok := hashToken(familyToken)
	if !ok {
		return models.Caller{}, models.ErrFamilySessionRequired
	}
	psHash, ok := hashToken(profileToken)
	if !ok {
		return models.Caller{}, s.classifyMiss(ctx, familyToken)
	}
	row, found, err := s.Repo.profileSession(ctx, fsHash, psHash)
	if err != nil {
		return models.Caller{}, err
	}
	if !found {
		return models.Caller{}, s.classifyMiss(ctx, familyToken)
	}
	now := s.Now()
	ps := row.Session
	device := window{id: *ps.FamilySessionID, lastSeen: row.DeviceLastSeenAt, idle: row.DeviceIdleExpiresAt, absolute: row.DeviceExpiresAt}
	if device.expired(now) {
		return models.Caller{}, s.expire(ctx, device.id, models.ErrFamilySessionRequired)
	}
	session := window{id: ps.ID, lastSeen: ps.LastSeenAt, idle: ps.IdleExpiresAt, absolute: ps.ExpiresAt}
	if session.expired(now) {
		return models.Caller{}, s.expire(ctx, session.id, models.ErrProfileSessionRequired)
	}
	if err := s.renew(ctx, device, FamilyIdleTimeout, passive); err != nil {
		return models.Caller{}, err
	}
	if err := s.renew(ctx, session, ProfileIdleTimeout, passive); err != nil {
		return models.Caller{}, err
	}
	return s.caller(ctx, callerRow{familyID: ps.FamilyID, device: device.id, session: ps.ID, profile: *ps.ProfileID,
		role: models.Role(row.Role), owner: row.IsOwner, timezone: row.Timezone, expires: ps.ExpiresAt})
}

func (s *Service) classifyMiss(ctx context.Context, familyToken string) error {
	if _, err := s.AuthenticateDevice(ctx, familyToken, true); err != nil {
		return err
	}
	return models.ErrProfileSessionRequired
}

type callerRow struct {
	familyID, device, session, profile uuid.UUID
	role                               models.Role
	owner                              bool
	timezone                           string
	expires                            time.Time
}

func (s *Service) caller(ctx context.Context, c callerRow) (models.Caller, error) {
	modules, err := s.Families.EnabledModules(ctx, c.familyID)
	if err != nil {
		return models.Caller{}, err
	}
	return models.Caller{
		FamilyID: c.familyID, FamilySessionID: c.device, SessionID: c.session, ProfileID: c.profile,
		Role: c.role, IsOwner: c.owner, Timezone: c.timezone, ExpiresAt: c.expires,
		Permissions: models.Permissions(c.role, c.owner, modules), Modules: modules,
	}, nil
}

func (s *Service) Devices(ctx context.Context, caller models.Caller) ([]Device, error) {
	if !caller.Can(models.FamilySessionsManage) {
		return nil, models.ErrForbidden
	}
	devices, err := s.Repo.devices(ctx, caller.FamilyID, s.Now())
	if err != nil {
		return nil, err
	}
	for i := range devices {
		devices[i].Current = devices[i].ID == caller.FamilySessionID
	}
	return devices, nil
}

func (s *Service) RevokeDevice(ctx context.Context, caller models.Caller, id uuid.UUID) (bool, error) {
	if !caller.Can(models.FamilySessionsManage) {
		return false, models.ErrForbidden
	}
	found, err := s.Repo.deleteDevice(ctx, caller.FamilyID, id)
	if err != nil {
		return false, err
	}
	if !found {
		return false, models.ErrNotFound
	}
	s.audit(ctx, "session.revoked", middleware.FamilyAttr(caller.FamilyID), middleware.SessionAttr(id), middleware.ActorAttr(caller.ProfileID))
	return id == caller.FamilySessionID, nil
}

func (s *Service) RevokeOtherDevices(ctx context.Context, caller models.Caller) error {
	if !caller.Can(models.FamilySessionsManage) {
		return models.ErrForbidden
	}
	n, err := s.Repo.deleteOtherDevices(ctx, caller.FamilyID, caller.FamilySessionID)
	if err != nil {
		return err
	}
	s.audit(ctx, "session.revoked_others", middleware.FamilyAttr(caller.FamilyID), middleware.SessionAttr(caller.FamilySessionID),
		middleware.ActorAttr(caller.ProfileID), slog.Int64("revoked", n))
	return nil
}

func (s *Service) ChangePassword(ctx context.Context, caller models.Caller, current, next string) error {
	if !caller.Can(models.FamilyAccountManage) {
		return models.ErrForbidden
	}
	if msg := checkPassword(next); msg != "" {
		return models.Invalid("newPassword", msg)
	}
	if err := s.Families.VerifyPassword(ctx, caller.FamilyID, current); err != nil {
		return err
	}
	hash, err := s.Hasher.Hash(next)
	if err != nil {
		return err
	}
	err = db.InTx(ctx, s.Pool, func(tx pgx.Tx) error {
		if err := family.NewRepository(tx).UpdatePassword(ctx, caller.FamilyID, hash); err != nil {
			return err
		}
		return NewRepository(tx).deleteFamilySessionsExcept(ctx, caller.FamilyID, []uuid.UUID{caller.FamilySessionID, caller.SessionID})
	})
	if err != nil {
		return err
	}
	s.audit(ctx, "family.password_changed", middleware.FamilyAttr(caller.FamilyID), middleware.ActorAttr(caller.ProfileID))
	return nil
}

func (s *Service) ResetPassword(ctx context.Context, email string) (string, error) {
	email, msg := models.NormalizeEmail(email)
	if msg != "" {
		return "", fmt.Errorf("invalid email: %s", msg)
	}
	password := rand.Text()
	hash, err := s.Hasher.Hash(password)
	if err != nil {
		return "", err
	}
	var familyID uuid.UUID
	err = db.InTx(ctx, s.Pool, func(tx pgx.Tx) error {
		families := family.NewRepository(tx)
		f, err := families.GetByEmail(ctx, email)
		if errors.Is(err, models.ErrNotFound) {
			return ErrUnknownFamily
		}
		if err != nil {
			return err
		}
		familyID = f.ID
		if err := families.UpdatePassword(ctx, f.ID, hash); err != nil {
			return err
		}
		return NewRepository(tx).deleteFamilySessionsExcept(ctx, f.ID, nil)
	})
	if err != nil {
		return "", err
	}
	s.audit(ctx, "family.password_changed", middleware.FamilyAttr(familyID), slog.String("by", "operator"))
	return password, nil
}

func (s *Service) RunCleanup(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := s.CleanupExpiredSessions(ctx); err != nil && ctx.Err() == nil {
				s.Log.ErrorContext(ctx, "session cleanup failed", "err", err)
			}
		}
	}
}

func (s *Service) CleanupExpiredSessions(ctx context.Context) (int64, error) {
	n, err := s.Repo.deleteExpired(ctx, s.Now())
	if err != nil {
		return 0, err
	}
	if n > 0 {
		s.Log.InfoContext(ctx, "expired sessions deleted", "count", n)
	}
	return n, nil
}
