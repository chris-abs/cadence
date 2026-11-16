package app

import (
	"context"
	"log/slog"
	"net/http"
	"net/netip"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/chris-abs/cadence/server/internal/api"
	"github.com/chris-abs/cadence/server/internal/identity/auth"
	"github.com/chris-abs/cadence/server/internal/identity/family"
	"github.com/chris-abs/cadence/server/internal/identity/profile"
	"github.com/chris-abs/cadence/server/internal/meals/meal"
	"github.com/chris-abs/cadence/server/internal/middleware"
	"github.com/chris-abs/cadence/server/internal/platform/httpx"
	"github.com/chris-abs/cadence/server/internal/platform/passhash"
)

type Deps struct {
	Logger         *slog.Logger
	DB             *pgxpool.Pool
	Env            Env
	Registration   auth.RegistrationMode
	TrustedProxies []netip.Prefix
	Now            func() time.Time
	Hasher         passhash.Hasher
	OpenAPIPath    string
}

type Handler struct {
	http.Handler
	auth *auth.Service
}

func (h *Handler) RunCleanup(ctx context.Context) {
	h.auth.RunCleanup(ctx, auth.CleanupInterval)
}

type services struct {
	auth    *auth.Service
	family  *family.Service
	profile *profile.Service
	meal    *meal.Service
}

func newServices(d Deps) (services, error) {
	if d.Now == nil {
		d.Now = time.Now
	}
	if d.Hasher == nil {
		d.Hasher = passhash.NewBcrypt(passhash.DefaultCost)
	}
	if d.Registration == "" {
		d.Registration = auth.RegistrationFirst
	}
	authRepo := auth.NewRepository(d.DB)
	families := family.NewService(d.DB, d.Hasher, d.Now, d.Logger)
	profiles := profile.NewService(d.DB, d.Hasher, d.Now, d.Logger, families, authRepo)
	authSvc, err := auth.NewService(auth.Deps{
		Pool: d.DB, Repo: authRepo, Families: families, Profiles: profiles,
		Hasher: d.Hasher, Now: d.Now, Log: d.Logger, Registration: d.Registration,
	})
	if err != nil {
		return services{}, err
	}
	return services{auth: authSvc, family: families, profile: profiles, meal: meal.NewService(d.DB)}, nil
}

func NewAuthService(d Deps) (*auth.Service, error) {
	s, err := newServices(d)
	return s.auth, err
}

func NewHandler(d Deps) (*Handler, error) {
	s, err := newServices(d)
	if err != nil {
		return nil, err
	}
	log := d.Logger
	cookies := middleware.NewCookies(d.Env != EnvDevelopment, d.Env == EnvProduction)
	sessions := middleware.NewAuth(s.auth, cookies, log)
	authH := auth.NewHandler(s.auth, cookies, d.TrustedProxies)
	familyH := family.NewHandler(s.family, cookies)
	profileH := profile.NewHandler(s.profile)
	mealH := meal.NewHandler(s.meal)

	type handlerFunc = func(http.ResponseWriter, *http.Request) error
	public := func(fn handlerFunc) http.Handler { return httpx.Handle(log, fn) }
	device := func(fn handlerFunc) http.Handler { return sessions.RequireFamily(httpx.Handle(log, fn)) }
	caller := func(fn handlerFunc) http.Handler { return sessions.RequireProfile(httpx.Handle(log, fn)) }
	meals := func(fn handlerFunc) http.Handler {
		return sessions.RequireProfile(middleware.RequireModule("meals", log)(httpx.Handle(log, fn)))
	}

	routes := map[string]http.Handler{
		"GET /healthz": healthz(d.DB, log),

		"GET /auth/registration":            public(authH.RegistrationStatus),
		"POST /auth/register":               public(authH.Register),
		"POST /auth/login":                  public(authH.Login),
		"POST /auth/logout":                 public(authH.Logout),
		"GET /auth/session":                 device(authH.FamilySession),
		"POST /auth/profile-session":        device(authH.SelectProfile),
		"DELETE /auth/profile-session":      device(authH.Lock),
		"GET /auth/sessions":                caller(authH.Devices),
		"DELETE /auth/sessions/{sessionId}": caller(authH.RevokeDevice),
		"POST /auth/sessions/revoke-others": caller(authH.RevokeOtherDevices),
		"GET /me":                           caller(authH.Me),
		"PUT /family/password":              caller(authH.ChangePassword),
		"GET /family":                       caller(familyH.Get),
		"PUT /family":                       caller(familyH.Update),
		"PUT /family/email":                 caller(familyH.ChangeEmail),
		"POST /family/delete":               caller(familyH.Delete),
		"GET /modules":                      caller(familyH.Modules),
		"PUT /modules/{moduleId}":           caller(familyH.SetModule),
		"GET /profiles":                     device(profileH.List),
		"POST /profiles":                    caller(profileH.Create),
		"GET /profiles/{profileId}":         caller(profileH.Get),
		"PUT /profiles/{profileId}":         caller(profileH.Update),
		"DELETE /profiles/{profileId}":      caller(profileH.Delete),
		"PUT /profiles/{profileId}/role":    caller(profileH.ChangeRole),
		"PUT /profiles/{profileId}/pin":     caller(profileH.SetPin),
		"POST /family/owner":                caller(profileH.TransferOwnership),
		"GET /meals":                        meals(mealH.List),
		"POST /meals":                       meals(mealH.Create),
		"GET /meals/{mealId}":               meals(mealH.Get),
		"PUT /meals/{mealId}":               meals(mealH.Update),
		"DELETE /meals/{mealId}":            meals(mealH.Delete),
		"GET /ingredient-names":             meals(mealH.IngredientNames),
	}
	mux := http.NewServeMux()
	for pattern, h := range routes {
		mux.Handle(pattern, h)
	}

	cop := http.NewCrossOriginProtection()
	cop.SetDenyHandler(middleware.CrossOriginDenied(log))
	apiHandler := cop.Handler(middleware.RequireJSONBody(log)(middleware.ErrorShapedFallbacks(mux, log)))

	root := http.NewServeMux()
	root.Handle("/api/", http.StripPrefix("/api", apiHandler))
	if d.Env != EnvProduction {
		mountDocs(root, d.OpenAPIPath, log)
	}
	return &Handler{
		Handler: middleware.Chain(root,
			middleware.SecurityHeaders(d.Env == EnvProduction),
			middleware.LogRequests(log),
			middleware.RecoverPanic(log),
			middleware.LimitBody(httpx.DefaultMaxBodyBytes),
		),
		auth: s.auth,
	}, nil
}

func healthz(pool *pgxpool.Pool, log *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		var err error
		if pingErr := pool.Ping(ctx); pingErr != nil {
			log.WarnContext(r.Context(), "health check: database ping failed", "err", pingErr)
			err = httpx.WriteError(w, http.StatusServiceUnavailable, httpx.CodeUnavailable, "The service cannot reach its database.", nil)
		} else {
			err = httpx.WriteJSON(w, http.StatusOK, api.Health{Status: api.HealthStatusOk})
		}
		if err != nil {
			log.ErrorContext(r.Context(), "health check: write response", "err", err)
		}
	})
}
