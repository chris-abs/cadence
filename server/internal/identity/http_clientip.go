package identity

import (
	"net"
	"net/http"
	"net/netip"
	"strings"
)

// clientIP is the address rate limits key on (spec §6.2): RemoteAddr, or the
// last X-Forwarded-For hop when the direct peer is a configured trusted proxy.
// Only the proxy's own appended hop is trusted; anything earlier is
// client-supplied and spoofable.
func clientIP(r *http.Request, trusted []netip.Prefix) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	peer, err := netip.ParseAddr(host)
	if err != nil || !fromTrusted(peer, trusted) {
		return host
	}
	xff := r.Header.Values("X-Forwarded-For")
	if len(xff) == 0 {
		return host
	}
	hops := strings.Split(xff[len(xff)-1], ",")
	if last, err := netip.ParseAddr(strings.TrimSpace(hops[len(hops)-1])); err == nil {
		return last.String()
	}
	return host
}

func fromTrusted(addr netip.Addr, trusted []netip.Prefix) bool {
	for _, p := range trusted {
		if p.Contains(addr.Unmap()) {
			return true
		}
	}
	return false
}
