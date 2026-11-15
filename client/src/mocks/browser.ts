import { setupWorker } from "msw/browser";
import { handlers } from "@/test/handlers";
import { mockApi } from "@/test/mock-api";

/**
 * The in-browser mock API for `VITE_MOCK_API=1 yarn dev`: the same typed,
 * stateful handlers the tests use. A new family gets two demo members (Alex,
 * a parent with PIN 123456, and Sam, a child) so switching and PINs can be
 * tried. State lives in memory and resets on reload.
 */
export async function startMockWorker() {
  mockApi.reset({ addDemoMembers: true, latencyMs: 250 });
  const worker = setupWorker(...handlers);
  await worker.start();
}
