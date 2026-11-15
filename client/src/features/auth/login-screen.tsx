import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Banner } from "@/components/banner";
import { CenteredLayout } from "@/components/centered-layout";
import { Countdown } from "@/components/countdown";
import { TextField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { applyFieldErrors, errorMessage } from "@/lib/forms";
import { currentPasswordField, emailField } from "@/lib/validation";
import { useLogin } from "./mutations";
import { useRegistrationStatus } from "./queries";
import { retryAt } from "./retry-after";

const loginSchema = z.object({
  email: emailField,
  password: currentPasswordField,
  deviceName: z.string().trim().max(60, "Use at most 60 characters."),
});
type LoginValues = z.infer<typeof loginSchema>;

/** Signs the device in to a family. */
export function LoginScreen() {
  const login = useLogin();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", deviceName: "" },
  });
  const { errors } = form.formState;
  const lockedUntil = retryAt(login);

  const onSubmit = form.handleSubmit(({ email, password, deviceName }) => {
    login.mutate(
      { email, password, ...(deviceName ? { deviceName } : {}) },
      {
        onError: (error) => {
          applyFieldErrors(error, form.setError, {
            email: "email",
            password: "password",
            deviceName: "deviceName",
          });
        },
      },
    );
  });

  return (
    <CenteredLayout
      title="Sign in to your family"
      description="Use the family's email and password. This device stays signed in."
      footer={<RegisterLink />}
    >
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
        {lockedUntil !== undefined ? (
          <Banner tone="error" title="Too many attempts">
            Try again in{" "}
            <Countdown key={lockedUntil} until={lockedUntil} onEnd={() => login.reset()} />.
          </Banner>
        ) : (
          login.error &&
          !isFieldError(login.error) && <Banner tone="error">{errorMessage(login.error)}</Banner>
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="username"
          error={errors.email?.message}
          {...form.register("email")}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...form.register("password")}
        />
        <TextField
          label="Device name (optional)"
          description="Helps you recognise this device later, e.g. Kitchen tablet."
          autoComplete="off"
          error={errors.deviceName?.message}
          {...form.register("deviceName")}
        />
        <Button type="submit" size="touch" disabled={login.isPending || lockedUntil !== undefined}>
          {login.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </CenteredLayout>
  );
}

function isFieldError(error: Error): boolean {
  return error instanceof ApiError && error.code === "validation_failed";
}

/** Offered only while a new family can register. */
function RegisterLink() {
  const { data } = useRegistrationStatus();
  if (!data?.open) return null;
  return (
    <p className="text-sm text-muted-foreground">
      New to Cadence?
      <Button variant="link" asChild>
        <Link to="/register">Create a family</Link>
      </Button>
    </p>
  );
}
