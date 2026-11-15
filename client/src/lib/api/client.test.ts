import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { apiUrl, health } from "@/test/handlers";
import { server } from "@/test/server";
import { api, unwrap } from "./client";
import { ApiError } from "./error";

const getHealth = () => unwrap(api.GET("/healthz"));

describe("unwrap", () => {
  it("returns the data of a successful response", async () => {
    await expect(getHealth()).resolves.toEqual({ status: "ok" });
  });

  it("throws an ApiError carrying the contract's error body", async () => {
    server.use(health.databaseDown());

    const error = await getHealth().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 503,
      code: "database_unavailable",
      message: "Database unavailable",
    });
  });

  it("throws a generic ApiError when the body is not an API error", async () => {
    server.use(http.get(apiUrl("/healthz"), () => new HttpResponse(null, { status: 502 })));

    await expect(getHealth()).rejects.toMatchObject({
      name: "ApiError",
      status: 502,
      code: "unknown",
    });
  });

  it("rejects when the network request fails", async () => {
    server.use(health.networkError());

    await expect(getHealth()).rejects.toThrow(TypeError);
  });
});

describe("api", () => {
  it("sends credentials so session cookies reach the API", async () => {
    let credentials: RequestCredentials | undefined;
    // Observe the request as built by the client; MSW's interception drops `credentials`.
    const spy = {
      onRequest({ request }: { request: Request }) {
        credentials = request.credentials;
      },
    };
    api.use(spy);
    try {
      await getHealth();
    } finally {
      api.eject(spy);
    }

    expect(credentials).toBe("include");
  });
});
