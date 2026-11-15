import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import type { components } from "@/lib/api";
import { apiUrl, identity } from "@/test/handlers";
import { mockApi, standardFamily } from "@/test/mock-api";
import { renderApp } from "@/test/render-app";
import { server } from "@/test/server";

type RegisterRequest = components["schemas"]["RegisterRequest"];

async function fillFamilyStep(email = "new@example.com") {
  await userEvent.type(await screen.findByLabelText("Family email"), email);
  await userEvent.type(screen.getByLabelText("Password"), "a long enough password");
  await userEvent.type(screen.getByLabelText("Family name"), "The Rivers");
  await userEvent.click(screen.getByRole("button", { name: "Next" }));
}

async function fillOwnerStep() {
  await userEvent.type(await screen.findByLabelText("Your name"), "Jo");
  await userEvent.click(screen.getByRole("radio", { name: "Amber" }));
  await userEvent.click(screen.getByRole("button", { name: "Create family" }));
}

describe("register", () => {
  it("creates the family and lands in the app as the owner", async () => {
    let sent: RegisterRequest | undefined;
    server.events.on("request:start", ({ request }) => {
      if (request.url.endsWith("/auth/register")) {
        void request
          .clone()
          .json()
          .then((body: RegisterRequest) => (sent = body));
      }
    });
    renderApp("/register");

    expect(await screen.findByRole("heading", { name: "Create your family" })).toBeInTheDocument();
    await fillFamilyStep();
    expect(await screen.findByRole("heading", { name: "Your profile" })).toBeInTheDocument();
    expect(screen.getByLabelText("Your name")).toHaveFocus();
    expect(screen.getByText(Intl.DateTimeFormat().resolvedOptions().timeZone)).toBeInTheDocument();
    await fillOwnerStep();

    expect(await screen.findByRole("heading", { name: "Hello, Jo" })).toBeInTheDocument();
    expect(sent).toEqual({
      email: "new@example.com",
      password: "a long enough password",
      familyName: "The Rivers",
      owner: {
        name: "Jo",
        colour: "amber",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    });
    server.events.removeAllListeners();
  });

  it("validates the family step before moving on", async () => {
    renderApp("/register");

    await userEvent.type(await screen.findByLabelText("Family email"), "nope");
    await userEvent.type(screen.getByLabelText("Password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Use at least 10 characters.")).toBeInTheDocument();
    expect(screen.getByText("Enter a family name.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create your family" })).toBeInTheDocument();
  });

  it("asks for a name and a colour on the owner step", async () => {
    renderApp("/register");
    await fillFamilyStep();

    await userEvent.click(await screen.findByRole("button", { name: "Create family" }));

    expect(await screen.findByText("Enter a name.")).toBeInTheDocument();
    expect(screen.getByText("Choose a colour.")).toBeInTheDocument();
  });

  it("puts the server's field errors on their fields, back on the right step", async () => {
    server.use(identity.registerValidationFailed({ password: "Too common a password." }));
    renderApp("/register");
    await fillFamilyStep();
    await fillOwnerStep();

    expect(await screen.findByText("Too common a password.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create your family" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Password")).toHaveFocus();
  });

  it("says when the email already has a family", async () => {
    renderApp("/register");
    await fillFamilyStep("taken@example.com");
    await fillOwnerStep();

    expect(await screen.findByText("That email already has a family.")).toBeInTheDocument();
    expect(screen.getByLabelText("Family email")).toHaveAttribute("aria-invalid", "true");
  });

  it("is not offered once registration has closed", async () => {
    mockApi.reset({ profiles: standardFamily() });
    const { router } = renderApp("/register");

    expect(
      await screen.findByRole("heading", { name: "Sign in to your family" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/login");
  });

  it("explains if registration closes while the form is open", async () => {
    renderApp("/register");
    await fillFamilyStep();
    server.use(
      http.post(apiUrl("/auth/register"), () =>
        HttpResponse.json(
          { error: { code: "registration_closed", message: "Registration is closed." } },
          { status: 403 },
        ),
      ),
    );
    await fillOwnerStep();

    expect(await screen.findByRole("alert")).toHaveTextContent("Registration is closed.");
  });
});
