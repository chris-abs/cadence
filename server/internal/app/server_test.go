package app

import (
	"context"
	"net"
	"net/http"
	"testing"
	"time"
)

func TestServeShutsDownGracefully(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	// The handler is mid-request when shutdown starts; it must still finish.
	inFlight := make(chan struct{})
	h := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		close(inFlight)
		time.Sleep(50 * time.Millisecond)
		w.WriteHeader(http.StatusNoContent)
	})

	ctx, cancel := context.WithCancel(t.Context())
	done := make(chan error, 1)
	go func() { done <- Serve(ctx, NewServer(h, discardLogger()), ln) }()

	status := make(chan int, 1)
	go func() {
		req, _ := http.NewRequestWithContext(t.Context(), http.MethodGet, "http://"+ln.Addr().String(), nil)
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			status <- 0
			return
		}
		_ = resp.Body.Close()
		status <- resp.StatusCode
	}()

	<-inFlight
	cancel()

	if err := <-done; err != nil {
		t.Fatalf("Serve: %v", err)
	}
	if got := <-status; got != http.StatusNoContent {
		t.Errorf("in-flight request status = %d, want 204", got)
	}
}

func TestServeReportsListenerFailure(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen: %v", err)
	}
	if err := ln.Close(); err != nil {
		t.Fatalf("close: %v", err)
	}
	if err := Serve(t.Context(), NewServer(http.NotFoundHandler(), discardLogger()), ln); err == nil {
		t.Fatal("expected an error from a closed listener")
	}
}
