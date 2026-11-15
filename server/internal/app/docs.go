package app

import (
	_ "embed"
	"log/slog"
	"net/http"
	"os"
)

//go:embed docs.html
var docsPage []byte

// Scalar reads its config from data attributes (no inline script) but injects <style> tags.
const docsCSP = "default-src 'none'; script-src https://cdn.jsdelivr.net; style-src 'unsafe-inline'; " +
	"img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"

func mountDocs(mux *http.ServeMux, specPath string, log *slog.Logger) {
	mux.HandleFunc("GET /docs", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", docsCSP)
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if _, err := w.Write(docsPage); err != nil {
			log.WarnContext(r.Context(), "docs: write page", "err", err)
		}
	})
	mux.HandleFunc("GET /docs/openapi.yaml", func(w http.ResponseWriter, r *http.Request) {
		spec, err := os.ReadFile(specPath) //nolint:gosec // The path comes from config, never from the request.
		if err != nil {
			log.ErrorContext(r.Context(), "docs: read contract", "path", specPath, "err", err)
			http.Error(w, "cannot read the API contract", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/yaml; charset=utf-8")
		if _, err := w.Write(spec); err != nil {
			log.WarnContext(r.Context(), "docs: write contract", "err", err)
		}
	})
}
