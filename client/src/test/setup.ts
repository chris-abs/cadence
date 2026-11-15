import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach } from "vitest";
import { server } from "./server";

// jsdom keeps Node's Request, which rejects relative URLs such as the API
// client's `/api` base. Resolve them against the page, as browsers do.
class BrowserRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === "string" ? new URL(input, window.location.href) : input, init);
  }
}
globalThis.Request = BrowserRequest;

// Listen before test modules load: openapi-fetch captures `fetch` when the client is created.
server.listen({ onUnhandledFrame: "error" });

afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});
