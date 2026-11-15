package identity

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/chris-abs/cadence/server/internal/authz"
	"github.com/chris-abs/cadence/server/internal/identity/internal/identitydb"
)

// registrationLockKey names the advisory lock that serialises registrations.
const registrationLockKey = 0x63616465 // "cade"

// registrationOpen reports whether a new family may register now (§6.1).
func (s *Service) registrationOpen(ctx context.Context) (bool, error) {
	switch s.registration {
	case RegistrationOpen:
		return true, nil
	case RegistrationClosed:
		return false, nil
	}
	exists, err := s.q.FamilyExists(ctx)
	if err != nil {
		return false, fmt.Errorf("check for families: %w", err)
	}
	return !exists, nil
}

// RegisterInput is a registration request. CurrentDeviceToken is this
// device's existing family-session cookie, if any; it is replaced.
type RegisterInput struct {
	Email, Password, FamilyName             string
	OwnerName, OwnerColour, OwnerTimezone   string
	OwnerAvatar, DeviceName                 *string
	UserAgent, ClientIP, CurrentDeviceToken string
}

// SignedIn is the result of register and profile selection: the new cookie
// tokens and the caller they authenticate.
type SignedIn struct {
	FamilyToken  string // empty when the family session was not replaced
	ProfileToken string
	session      callerSession
}

// Caller is the signed-in caller as other domains see it.
func (s SignedIn) Caller() Caller { return s.session.public() }

// Register creates a family, its owner, and signs this device in as the owner,
// all in one transaction under an advisory lock (R10).
func (s *Service) Register(ctx context.Context, in RegisterInput) (SignedIn, error) {
	if s.registration == RegistrationClosed {
		return SignedIn{}, ErrRegistrationClosed
	}
	if ok, wait := s.limits.registerPerIP.Allow(in.ClientIP); !ok {
		return SignedIn{}, s.rateLimited(ctx, "register_per_ip", wait)
	}

	fe := fieldErrors{}
	email, msg := normalizeEmail(in.Email)
	fe.add("email", msg)
	fe.add("password", checkPassword(in.Password))
	familyName, msg := normalizeName(in.FamilyName, maxFamilyNameChars)
	fe.add("familyName", msg)
	ownerName, msg := normalizeName(in.OwnerName, maxProfileNameChars)
	fe.add("owner.name", msg)
	fe.add("owner.colour", checkColour(in.OwnerColour))
	fe.add("owner.avatar", checkAvatar(in.OwnerAvatar))
	fe.add("owner.timezone", checkTimezone(in.OwnerTimezone))
	deviceName, msg := normalizeDeviceName(in.DeviceName)
	fe.add("deviceName", msg)
	if err := fe.err(); err != nil {
		return SignedIn{}, err
	}

	// bcrypt runs before the transaction so the advisory lock is held briefly.
	hash, err := s.hasher.Hash(in.Password)
	if err != nil {
		return SignedIn{}, err
	}
	familyID, err := newID()
	if err != nil {
		return SignedIn{}, err
	}
	ownerID, err := newID()
	if err != nil {
		return SignedIn{}, err
	}

	var out SignedIn
	err = s.inTx(ctx, func(q *identitydb.Queries) error {
		if err := q.LockRegistration(ctx, registrationLockKey); err != nil {
			return fmt.Errorf("lock registration: %w", err)
		}
		if s.registration == RegistrationFirst {
			exists, err := q.FamilyExists(ctx)
			if err != nil {
				return fmt.Errorf("check for families: %w", err)
			}
			if exists {
				return ErrRegistrationClosed
			}
		}
		if err := s.dropDevice(ctx, q, in.CurrentDeviceToken); err != nil {
			return err
		}
		family, err := q.CreateFamily(ctx, identitydb.CreateFamilyParams{ID: familyID, Name: familyName, Email: email, PasswordHash: hash})
		if uniqueViolation(err, constraintFamilyEmail) {
			return ErrEmailTaken
		}
		if err != nil {
			return fmt.Errorf("create family: %w", err)
		}
		owner, err := q.CreateProfile(ctx, identitydb.CreateProfileParams{
			ID: ownerID, FamilyID: family.ID, Name: ownerName, Role: string(authz.Parent), IsOwner: true,
			Colour: in.OwnerColour, Avatar: in.OwnerAvatar, Timezone: in.OwnerTimezone,
		})
		if err != nil {
			return fmt.Errorf("create owner profile: %w", err)
		}
		fsToken, fsID, err := s.createFamilySession(ctx, q, family.ID, deviceName, in.UserAgent)
		if err != nil {
			return err
		}
		psToken, psID, expires, err := s.createProfileSession(ctx, q, fsID, family.ID, owner.ID)
		if err != nil {
			return err
		}
		subject, err := s.subjectFor(ctx, q, owner)
		if err != nil {
			return err
		}
		out = SignedIn{FamilyToken: fsToken, ProfileToken: psToken, session: callerSession{
			device: deviceSession{SessionID: fsID, Family: family}, SessionID: psID, ExpiresAt: expires,
			Profile: owner, Subject: subject,
		}}
		return nil
	})
	if err != nil {
		return SignedIn{}, err
	}
	s.audit.event(ctx, evFamilyRegistered, familyAttr(familyID), profileAttr(ownerID), sessionAttr(out.session.device.SessionID))
	return out, nil
}

// loginInput is a login request.
type loginInput struct {
	Email, Password                         string
	DeviceName                              *string
	UserAgent, ClientIP, CurrentDeviceToken string
}

// loggedIn is a successful login: the new family-session token and what the
// picker needs.
type loggedIn struct {
	Token    string
	device   deviceSession
	Profiles []profileItem
}

// login signs this device in to a family. Unknown email and wrong password
// cost the same bcrypt time and return the same ErrInvalidCredentials (§6.3).
func (s *Service) login(ctx context.Context, in loginInput) (loggedIn, error) {
	if ok, wait := s.limits.loginPerIP.Allow(in.ClientIP); !ok {
		return loggedIn{}, s.rateLimited(ctx, "login_per_ip", wait)
	}
	fe := fieldErrors{}
	email := strings.ToLower(strings.TrimSpace(in.Email))
	switch {
	case email == "":
		fe.add("email", "Enter your email address.")
	case len(email) > maxEmailLength:
		fe.add("email", "Use at most 254 characters.")
	}
	switch {
	case in.Password == "":
		fe.add("password", "Enter your password.")
	case utf8.RuneCountInString(in.Password) > maxPasswordChars:
		fe.add("password", "Use at most 72 characters.")
	}
	deviceName, msg := normalizeDeviceName(in.DeviceName)
	fe.add("deviceName", msg)
	if err := fe.err(); err != nil {
		return loggedIn{}, err
	}
	if ok, wait := s.limits.loginPerEmail.Check(email); !ok {
		return loggedIn{}, s.rateLimited(ctx, "login_per_email", wait)
	}

	family, reason, err := s.checkCredentials(ctx, email, in.Password)
	if err != nil {
		return loggedIn{}, err
	}
	if reason != "" {
		s.limits.loginPerEmail.Fail(email)
		s.audit.event(ctx, evLoginFailed, slog.String("reason", reason))
		return loggedIn{}, ErrInvalidCredentials
	}

	var out loggedIn
	err = s.inTx(ctx, func(q *identitydb.Queries) error {
		if err := s.dropDevice(ctx, q, in.CurrentDeviceToken); err != nil {
			return err
		}
		token, id, err := s.createFamilySession(ctx, q, family.ID, deviceName, in.UserAgent)
		if err != nil {
			return err
		}
		profiles, err := s.listProfiles(ctx, q, family.ID)
		if err != nil {
			return err
		}
		out = loggedIn{Token: token, device: deviceSession{SessionID: id, Family: family}, Profiles: profiles}
		return nil
	})
	if err != nil {
		return loggedIn{}, err
	}
	s.audit.event(ctx, evLoginSucceeded, familyAttr(family.ID), sessionAttr(out.device.SessionID))
	return out, nil
}

// checkCredentials returns the family, or a failure reason for the audit log.
// It always runs exactly one bcrypt comparison.
func (s *Service) checkCredentials(ctx context.Context, email, password string) (identitydb.Family, string, error) {
	family, err := s.q.GetFamilyByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		if _, err := s.hasher.Matches(s.dummyHash, password); err != nil {
			return identitydb.Family{}, "", fmt.Errorf("dummy compare: %w", err)
		}
		return identitydb.Family{}, "unknown_email", nil
	}
	if err != nil {
		return identitydb.Family{}, "", fmt.Errorf("load family by email: %w", err)
	}
	if len(password) > maxPasswordBytes {
		// No stored password can be this long; bcrypt would refuse it.
		if _, err := s.hasher.Matches(s.dummyHash, ""); err != nil {
			return identitydb.Family{}, "", fmt.Errorf("dummy compare: %w", err)
		}
		return identitydb.Family{}, "bad_password", nil
	}
	ok, err := s.hasher.Matches(family.PasswordHash, password)
	if err != nil {
		return identitydb.Family{}, "", fmt.Errorf("compare password: %w", err)
	}
	if !ok {
		return identitydb.Family{}, "bad_password", nil
	}
	return family, "", nil
}

// dropDevice deletes the family session behind a cookie value, if any; login
// and register replace it. Its profile session goes by cascade.
func (s *Service) dropDevice(ctx context.Context, q *identitydb.Queries, token string) error {
	hash, ok := hashToken(token)
	if !ok {
		return nil
	}
	rows, err := q.DeleteFamilySessionByToken(ctx, hash)
	if err != nil {
		return fmt.Errorf("delete device session: %w", err)
	}
	for _, r := range rows {
		s.audit.event(ctx, evLogout, familyAttr(r.FamilyID), sessionAttr(r.ID), slog.String("reason", "replaced"))
	}
	return nil
}

// logout signs this device out. It is idempotent: an unknown or missing
// token is not an error.
func (s *Service) logout(ctx context.Context, token string) error {
	return s.dropDevice(ctx, s.q, token)
}

// selectProfile switches the device to a profile, checking its PIN if it has
// one. Wrong PINs count towards the profile's lockout and are committed even
// though the call fails.
func (s *Service) selectProfile(ctx context.Context, device deviceSession, profileID uuid.UUID, pin *string) (SignedIn, error) {
	if ok, wait := s.limits.selectPerDevice.Allow(device.SessionID.String()); !ok {
		return SignedIn{}, s.rateLimited(ctx, "select_per_device", wait, familyAttr(device.Family.ID), sessionAttr(device.SessionID))
	}
	if pin != nil {
		if msg := checkPIN(*pin); msg != "" {
			return SignedIn{}, &ValidationError{Fields: map[string]string{"pin": msg}}
		}
	}

	var (
		out     SignedIn
		verdict error // a refusal that must not roll back the recorded failure
	)
	err := s.inTx(ctx, func(q *identitydb.Queries) error {
		profile, err := q.GetProfileForUpdate(ctx, identitydb.GetProfileForUpdateParams{FamilyID: device.Family.ID, ID: profileID})
		if err != nil {
			return notFound(err, "load profile")
		}
		if profile.PinHash != nil {
			if pin == nil {
				return &ValidationError{Fields: map[string]string{"pin": "Enter the PIN."}}
			}
			if verdict, err = s.verifyPIN(ctx, q, profile, *pin); err != nil || verdict != nil {
				return err
			}
		}
		token, psID, expires, err := s.createProfileSession(ctx, q, device.SessionID, device.Family.ID, profile.ID)
		if err != nil {
			return err
		}
		subject, err := s.subjectFor(ctx, q, profile)
		if err != nil {
			return err
		}
		out = SignedIn{ProfileToken: token, session: callerSession{
			device: device, SessionID: psID, ExpiresAt: expires, Profile: profile, Subject: subject,
		}}
		return nil
	})
	if err != nil {
		return SignedIn{}, err
	}
	if verdict != nil {
		return SignedIn{}, verdict
	}
	s.audit.event(ctx, evProfileSelected, familyAttr(device.Family.ID), profileAttr(profileID), sessionAttr(out.session.SessionID))
	return out, nil
}

// lock deletes this device's profile session (back to the picker).
func (s *Service) lock(ctx context.Context, device deviceSession) error {
	if err := s.q.DeleteDeviceProfileSession(ctx, &device.SessionID); err != nil {
		return fmt.Errorf("lock device: %w", err)
	}
	return nil
}

// profileItem is a profile with its current lockout, if any.
type profileItem struct {
	Profile     identitydb.Profile
	LockedUntil *time.Time
	// LockedFor is how long the lock has left at listing time; set only for
	// the picker, whose countdown must not depend on the device clock.
	LockedFor time.Duration
}

// familyProfiles is the picker for a device.
func (s *Service) familyProfiles(ctx context.Context, familyID uuid.UUID) ([]profileItem, error) {
	return s.listProfiles(ctx, s.q, familyID)
}

func (s *Service) listProfiles(ctx context.Context, q *identitydb.Queries, familyID uuid.UUID) ([]profileItem, error) {
	rows, err := q.ListProfiles(ctx, familyID)
	if err != nil {
		return nil, fmt.Errorf("list profiles: %w", err)
	}
	now := s.now()
	items := make([]profileItem, len(rows))
	for i, r := range rows {
		items[i] = profileItem{Profile: r.Profile, LockedUntil: activeLock(r.LockedUntil, now)}
		if items[i].LockedUntil != nil {
			items[i].LockedFor = items[i].LockedUntil.Sub(now)
		}
	}
	return items, nil
}

// activeLock hides a lockout that has already passed.
func activeLock(until *time.Time, now time.Time) *time.Time {
	if until == nil || !now.Before(*until) {
		return nil
	}
	return until
}
