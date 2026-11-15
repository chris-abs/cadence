package httpx

import "net/http"

// Route is one entry of the /api mux. Pattern is a ServeMux pattern relative
// to /api and matching the contract path, e.g. "GET /healthz". Every domain
// exposes its endpoints as Routes() []Route and app registers them uniformly.
type Route struct {
	Pattern string
	Handler http.Handler
}
