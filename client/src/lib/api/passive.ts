/**
 * Request options for background requests (polling, sync). The server never
 * renews a session on a passive request, so polling cannot keep a shared tablet
 * unlocked (spec §3). Spread into a call: `api.GET("/x", { signal, ...passive })`.
 */
export const passive = {
  headers: { "X-Cadence-Passive": "1" },
} as const;
