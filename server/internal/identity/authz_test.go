package identity_test

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"testing"

	"github.com/chris-abs/cadence/server/internal/api"
)

// The authorisation matrix (spec §8): every endpoint × actor × target through
// the real router, one fresh pair of families per cell so no cell depends on
// another. A route registered without rows here fails TestMatrixCoversEveryRoute.

type actor string

const (
	noCookie    actor = "no cookie"
	fsOnly      actor = "FS only"
	psOnly      actor = "PS only (no FS)"
	psOtherFS   actor = "PS + other device's FS"
	asChild     actor = "CHILD"
	asParent    actor = "PARENT"
	asOwner     actor = "owner"
	otherParent actor = "PARENT of another family"
)

type target string

const (
	tNone   target = ""
	tSelf   target = "self"
	tChild  target = "CHILD"
	tParent target = "PARENT"
	tOwner  target = "owner"
	tOther  target = "other family's"
)

type authKind int

const (
	public authKind = iota
	familyRoute
	profileRoute
)

type cell struct {
	actor  actor
	target target
	status int
	code   string
}

type endpoint struct {
	pattern string
	auth    authKind
	// ok is the success status, used for generated rows (FS routes with an FS).
	ok int
	// body builds the request body for a cell; nil means none.
	body func(fx *fixture, a actor, tg target) any
	// decode checks a success body against its contract type.
	decode func(t *testing.T, rec *httptest.ResponseRecorder)
	cells  []cell
}

// fixture is family A (owner, PARENT, CHILD, FS-only device) and family B.
type fixture struct {
	e    *env
	a, b *family
}

func newFixture(e *env) *fixture {
	return &fixture{e: e, a: e.newFamily("Alpha"), b: e.newFamily("Bravo")}
}

// device returns the cookies an actor sends.
func (fx *fixture) device(a actor) *device {
	switch a {
	case noCookie:
		return fx.e.device()
	case fsOnly:
		return fx.a.fsOnly
	case psOnly:
		return fx.a.owner.dev.with(map[string]string{profileCookie: fx.a.owner.dev.cookies[profileCookie]})
	case psOtherFS:
		return fx.a.owner.dev.with(map[string]string{
			profileCookie: fx.a.owner.dev.cookies[profileCookie], familyCookie: fx.a.fsOnly.cookies[familyCookie],
		})
	case asChild:
		return fx.a.child.dev
	case asParent:
		return fx.a.parent.dev
	case asOwner:
		return fx.a.owner.dev
	case otherParent:
		return fx.b.owner.dev
	}
	panic("unknown actor " + a)
}

// self returns the actor's own profile (for tSelf), or the owner of A.
func (fx *fixture) self(a actor) member {
	switch a {
	case asChild:
		return fx.a.child
	case asParent:
		return fx.a.parent
	case otherParent:
		return fx.b.owner
	default:
		return fx.a.owner
	}
}

// targetMember resolves a target: A's members, or B's owner for tOther.
func (fx *fixture) targetMember(a actor, tg target) member {
	switch tg {
	case tChild:
		return fx.a.child
	case tParent:
		return fx.a.parent
	case tOwner:
		return fx.a.owner
	case tOther:
		return fx.b.owner
	default:
		return fx.self(a)
	}
}

func (fx *fixture) path(ep endpoint, a actor, tg target) string {
	path := strings.SplitN(ep.pattern, " ", 2)[1]
	m := fx.targetMember(a, tg)
	path = strings.ReplaceAll(path, "{profileId}", m.id)
	if strings.Contains(path, "{sessionId}") {
		path = strings.ReplaceAll(path, "{sessionId}", m.dev.sessionID(familyCookie).String())
	}
	return strings.ReplaceAll(path, "{moduleId}", "meals")
}

// pw is the password of the actor's own family (all fixtures share one).
func pw(*fixture, actor) string { return testPassword }

// Expectations shared by many rows.
func ok(a actor, tg target, status int) cell { return cell{a, tg, status, ""} }
func forbidden(a actor, tg target) cell      { return cell{a, tg, http.StatusForbidden, "forbidden"} }
func notFound(a actor, tg target) cell       { return cell{a, tg, http.StatusNotFound, "not_found"} }
func conflict(a actor, tg target, code string) cell {
	return cell{a, tg, http.StatusConflict, code}
}

// each expands one expectation over targets.
func each(targets []target, f func(tg target) cell) []cell {
	out := make([]cell, 0, len(targets))
	for _, tg := range targets {
		out = append(out, f(tg))
	}
	return out
}

var (
	aTargets   = []target{tSelf, tChild, tParent, tOwner, tOther}
	roleActors = []actor{asChild, asParent, asOwner, otherParent}
)

// allRoles gives every role actor the same expectation.
func allRoles(status int, code string) []cell {
	var out []cell
	for _, a := range roleActors {
		out = append(out, cell{a, tNone, status, code})
	}
	return out
}

// parentsOnly: CHILD forbidden, every PARENT (incl. another family's, on its
// own family) allowed.
func parentsOnly(status int) []cell {
	return []cell{forbidden(asChild, tNone), ok(asParent, tNone, status), ok(asOwner, tNone, status), ok(otherParent, tNone, status)}
}

// ownerOnly: only owners (A's, and B's on its own family).
func ownerOnly(status int) []cell {
	return []cell{forbidden(asChild, tNone), forbidden(asParent, tNone), ok(asOwner, tNone, status), ok(otherParent, tNone, status)}
}

// crossFamily: another family's PARENT gets 404 for every A target, and
// the usual answer for itself.
func crossFamily(selfCell cell) []cell {
	out := []cell{notFound(otherParent, tChild), notFound(otherParent, tParent), notFound(otherParent, tOwner)}
	selfCell.actor, selfCell.target = otherParent, tSelf
	return append(out, selfCell)
}

func matrix() []endpoint {
	cat := func(cells ...[]cell) []cell { return slices.Concat(cells...) }
	register := func(fx *fixture, _ actor, _ target) any {
		return map[string]any{"email": fmt.Sprintf("new%d@example.com", fx.e.uniq()), "password": testPassword, "familyName": "New",
			"owner": map[string]any{"name": "N", "colour": "red", "timezone": "UTC"}}
	}
	return []endpoint{
		{pattern: "GET /healthz", auth: public, ok: 200},
		{pattern: "GET /auth/registration", auth: public, ok: 200, decode: decodes[api.RegistrationStatus]},
		{pattern: "POST /auth/register", auth: public, ok: 201, body: register, decode: decodes[api.Me]},
		{pattern: "POST /auth/login", auth: public, ok: 200, decode: decodes[api.FamilySession],
			body: func(fx *fixture, _ actor, _ target) any {
				return map[string]any{"email": fx.a.email, "password": testPassword}
			}},
		{pattern: "POST /auth/logout", auth: public, ok: 204},

		{pattern: "GET /auth/session", auth: familyRoute, ok: 200, decode: decodes[api.FamilySession], cells: allRoles(200, "")},
		{pattern: "GET /profiles", auth: familyRoute, ok: 200, decode: decodes[api.ProfileList], cells: allRoles(200, "")},
		{pattern: "DELETE /auth/profile-session", auth: familyRoute, ok: 204, cells: allRoles(204, "")},
		{pattern: "POST /auth/profile-session", auth: familyRoute, ok: 200, decode: decodes[api.Me],
			body: func(fx *fixture, a actor, tg target) any {
				if tg == tNone {
					tg = tChild
				}
				return map[string]any{"profileId": fx.targetMember(a, tg).id}
			},
			cells: cat(
				each(aTargets, func(tg target) cell {
					if tg == tOther {
						return notFound(asChild, tg)
					}
					return ok(asChild, tg, 200)
				}),
				[]cell{ok(asParent, tOwner, 200), notFound(asParent, tOther), ok(asOwner, tParent, 200), notFound(asOwner, tOther)},
				crossFamily(ok(otherParent, tSelf, 200)),
			)},

		{pattern: "GET /me", auth: profileRoute, decode: decodes[api.Me], cells: allRoles(200, "")},
		{pattern: "GET /auth/sessions", auth: profileRoute, decode: decodes[api.DeviceSessionList], cells: parentsOnly(200)},
		{pattern: "POST /auth/sessions/revoke-others", auth: profileRoute, cells: parentsOnly(204)},
		{pattern: "DELETE /auth/sessions/{sessionId}", auth: profileRoute, cells: cat(
			each(aTargets, func(tg target) cell { return forbidden(asChild, tg) }),
			[]cell{ok(asParent, tSelf, 204), ok(asParent, tChild, 204), ok(asParent, tOwner, 204), notFound(asParent, tOther)},
			[]cell{ok(asOwner, tSelf, 204), ok(asOwner, tParent, 204), notFound(asOwner, tOther)},
			crossFamily(ok(otherParent, tSelf, 204)),
		)},

		{pattern: "GET /family", auth: profileRoute, decode: decodes[api.Family], cells: parentsOnly(200)},
		{pattern: "PUT /family", auth: profileRoute, decode: decodes[api.Family], cells: parentsOnly(200),
			body: func(*fixture, actor, target) any { return map[string]any{"name": "Renamed", "autoLockMinutes": 5} }},
		{pattern: "PUT /family/email", auth: profileRoute, decode: decodes[api.Family], cells: ownerOnly(200),
			body: func(fx *fixture, a actor, _ target) any {
				return map[string]any{"email": fmt.Sprintf("moved%d@example.com", fx.e.uniq()), "password": pw(fx, a)}
			}},
		{pattern: "PUT /family/password", auth: profileRoute, cells: ownerOnly(204),
			body: func(fx *fixture, a actor, _ target) any {
				return map[string]any{"currentPassword": pw(fx, a), "newPassword": "another good password"}
			}},
		{pattern: "POST /family/delete", auth: profileRoute, cells: ownerOnly(204),
			body: func(fx *fixture, a actor, _ target) any {
				name := fx.a.name
				if a == otherParent {
					name = fx.b.name
				}
				return map[string]any{"password": pw(fx, a), "confirmName": strings.ToUpper(name)}
			}},
		{pattern: "POST /family/owner", auth: profileRoute,
			body: func(fx *fixture, a actor, tg target) any {
				return map[string]any{"profileId": fx.targetMember(a, tg).id, "password": pw(fx, a)}
			},
			cells: cat(
				each(aTargets, func(tg target) cell { return forbidden(asChild, tg) }),
				each(aTargets, func(tg target) cell { return forbidden(asParent, tg) }),
				[]cell{
					conflict(asOwner, tSelf, "self_not_allowed"), ok(asOwner, tParent, 204), notFound(asOwner, tOther),
					{asOwner, tChild, http.StatusUnprocessableEntity, "validation_failed"},
				},
				crossFamily(conflict(otherParent, tSelf, "self_not_allowed")),
			)},

		{pattern: "POST /profiles", auth: profileRoute, decode: decodes[api.Profile], cells: parentsOnly(201),
			body: func(*fixture, actor, target) any {
				return map[string]any{"name": "Newbie", "role": "PARENT", "colour": "lime"}
			}},
		{pattern: "GET /profiles/{profileId}", auth: profileRoute, decode: decodes[api.Profile], cells: cat(
			each(aTargets, func(tg target) cell {
				if tg == tOther {
					return notFound(asChild, tg)
				}
				return ok(asChild, tg, 200)
			}),
			each(aTargets, func(tg target) cell {
				if tg == tOther {
					return notFound(asParent, tg)
				}
				return ok(asParent, tg, 200)
			}),
			[]cell{ok(asOwner, tSelf, 200), ok(asOwner, tChild, 200), notFound(asOwner, tOther)},
			crossFamily(ok(otherParent, tSelf, 200)),
		)},
		{pattern: "PUT /profiles/{profileId}", auth: profileRoute, decode: decodes[api.Profile],
			body: func(fx *fixture, _ actor, _ target) any {
				return map[string]any{"name": fmt.Sprintf("Renamed %d", fx.e.uniq()), "colour": "sky", "avatar": "fox", "timezone": "UTC", "contactEmail": nil}
			},
			cells: cat(
				[]cell{ok(asChild, tSelf, 200), forbidden(asChild, tParent), forbidden(asChild, tOwner), notFound(asChild, tOther)},
				[]cell{ok(asParent, tSelf, 200), ok(asParent, tChild, 200), ok(asParent, tOwner, 200), notFound(asParent, tOther)},
				[]cell{ok(asOwner, tSelf, 200), ok(asOwner, tChild, 200), ok(asOwner, tParent, 200), notFound(asOwner, tOther)},
				crossFamily(ok(otherParent, tSelf, 200)),
			)},
		{pattern: "DELETE /profiles/{profileId}", auth: profileRoute, cells: cat(
			each(aTargets, func(tg target) cell { return forbidden(asChild, tg) }),
			[]cell{conflict(asParent, tSelf, "self_not_allowed"), ok(asParent, tChild, 204), conflict(asParent, tOwner, "owner_protected"), notFound(asParent, tOther)},
			[]cell{conflict(asOwner, tSelf, "self_not_allowed"), ok(asOwner, tChild, 204), ok(asOwner, tParent, 204), notFound(asOwner, tOther)},
			crossFamily(conflict(otherParent, tSelf, "self_not_allowed")),
		)},
		{pattern: "PUT /profiles/{profileId}/role", auth: profileRoute, decode: decodes[api.Profile],
			body: func(_ *fixture, _ actor, tg target) any {
				if tg == tChild {
					return map[string]any{"role": "PARENT"}
				}
				return map[string]any{"role": "CHILD"}
			},
			cells: cat(
				each(aTargets, func(tg target) cell { return forbidden(asChild, tg) }),
				[]cell{conflict(asParent, tSelf, "self_not_allowed"), ok(asParent, tChild, 200), conflict(asParent, tOwner, "owner_protected"), notFound(asParent, tOther)},
				[]cell{conflict(asOwner, tSelf, "self_not_allowed"), ok(asOwner, tChild, 200), ok(asOwner, tParent, 200), notFound(asOwner, tOther)},
				crossFamily(conflict(otherParent, tSelf, "self_not_allowed")),
			)},
		{pattern: "PUT /profiles/{profileId}/pin", auth: profileRoute,
			body: func(*fixture, actor, target) any { return map[string]any{"pin": "123456"} },
			cells: cat(
				[]cell{ok(asChild, tSelf, 204), forbidden(asChild, tParent), forbidden(asChild, tOwner), notFound(asChild, tOther)},
				[]cell{ok(asParent, tSelf, 204), ok(asParent, tChild, 204), forbidden(asParent, tOwner), notFound(asParent, tOther)},
				[]cell{ok(asOwner, tSelf, 204), ok(asOwner, tChild, 204), ok(asOwner, tParent, 204), notFound(asOwner, tOther)},
				crossFamily(ok(otherParent, tSelf, 204)),
			)},

		{pattern: "GET /modules", auth: profileRoute, decode: decodes[api.ModuleList], cells: allRoles(200, "")},
		{pattern: "PUT /modules/{moduleId}", auth: profileRoute, decode: decodes[api.Module], cells: parentsOnly(200),
			body: func(*fixture, actor, target) any { return map[string]any{"enabled": false} }},
	}
}

// rows expands an endpoint into every cell, adding the session rows the
// route's kind implies (R1, R2): these never depend on role or target.
func (ep endpoint) rows() []cell {
	var out []cell
	switch ep.auth {
	case public:
		for _, a := range []actor{noCookie, fsOnly, psOnly, asChild, asOwner, otherParent} {
			out = append(out, ok(a, tNone, ep.ok))
		}
	case familyRoute:
		out = append(out,
			cell{noCookie, tNone, 401, "family_session_required"},
			cell{psOnly, tNone, 401, "family_session_required"},
			ok(fsOnly, tNone, ep.ok),
			ok(psOtherFS, tNone, ep.ok), // a valid FS: the stray PS is irrelevant here
		)
	case profileRoute:
		out = append(out,
			cell{noCookie, tOwner, 401, "family_session_required"},
			cell{psOnly, tOwner, 401, "family_session_required"},
			cell{fsOnly, tOwner, 401, "profile_session_required"},
			cell{psOtherFS, tOwner, 401, "profile_session_required"},
		)
	}
	return append(out, ep.cells...)
}

// decodes checks a success body strictly against contract type T.
func decodes[T any](t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	decode[T](t, rec)
}

func TestAuthorisationMatrix(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	for _, ep := range matrix() {
		for _, c := range ep.rows() {
			name := fmt.Sprintf("%s/%s/%s", ep.pattern, c.actor, c.target)
			t.Run(name, func(t *testing.T) {
				t.Parallel()
				fx := newFixture(e.forTest(t))
				dev := fx.device(c.actor)
				var body any
				if ep.body != nil {
					body = ep.body(fx, c.actor, c.target)
				}
				method := strings.SplitN(ep.pattern, " ", 2)[0]
				rec := dev.do(method, fx.path(ep, c.actor, c.target), body)
				wantStatus(t, rec, c.status, c.code)
				if ep.decode != nil && c.status < 300 {
					ep.decode(t, rec)
				}
			})
		}
	}
}

func TestMatrixCoversEveryRoute(t *testing.T) {
	t.Parallel()
	e := newEnv(t)
	covered := map[string]bool{}
	for _, ep := range matrix() {
		if len(ep.rows()) == 0 {
			t.Errorf("%s has no rows", ep.pattern)
		}
		covered[ep.pattern] = true
	}
	for _, p := range e.h.Patterns() {
		if !covered[p] {
			t.Errorf("route %q has no authorisation matrix rows", p)
		}
		delete(covered, p)
	}
	for p := range covered {
		t.Errorf("matrix row for %q, which is not a registered route", p)
	}
}
