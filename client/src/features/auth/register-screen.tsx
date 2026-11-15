import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { flushSync } from "react-dom";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Banner } from "@/components/banner";
import { CenteredLayout } from "@/components/centered-layout";
import { ColourPicker } from "@/components/colour-picker";
import { Countdown } from "@/components/countdown";
import { TextField } from "@/components/form-field";
import { PROFILE_COLOURS } from "@/components/profile-colours";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { applyFieldErrors, errorMessage, type FieldMap } from "@/lib/forms";
import { browserTimeZone } from "@/lib/time";
import { emailField, familyNameField, newPasswordField, profileNameField } from "@/lib/validation";
import { useRegister } from "./mutations";
import { retryAt } from "./retry-after";

const registerSchema = z.object({
  email: emailField,
  password: newPasswordField,
  familyName: familyNameField,
  ownerName: profileNameField,
  colour: z.enum(PROFILE_COLOURS, "Choose a colour."),
});
type RegisterValues = z.infer<typeof registerSchema>;

const FAMILY_STEP_FIELDS = ["email", "password", "familyName"] as const;

/**
 * Server field names → form fields. The contract does not say how nested
 * fields are named; both the dotted path and the bare name are accepted.
 */
const SERVER_FIELDS: FieldMap<RegisterValues> = {
  email: "email",
  password: "password",
  familyName: "familyName",
  "owner.name": "ownerName",
  name: "ownerName",
  "owner.colour": "colour",
  colour: "colour",
};

type Step = "family" | "owner";

/** Creates a family in two steps: the account, then the owner's profile. */
export function RegisterScreen() {
  const register = useRegister();
  const [step, setStep] = useState<Step>("family");
  const [timezone] = useState(browserTimeZone);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", familyName: "", ownerName: "", colour: undefined },
  });
  const { errors } = form.formState;
  const rateLimitedUntil = retryAt(register);

  async function next() {
    if (await form.trigger(FAMILY_STEP_FIELDS)) {
      register.reset();
      // Render the next step now so its first field can take focus.
      flushSync(() => {
        setStep("owner");
      });
      form.setFocus("ownerName");
    }
  }

  const onSubmit = form.handleSubmit((values) => {
    register.mutate(
      {
        email: values.email,
        password: values.password,
        familyName: values.familyName,
        owner: { name: values.ownerName, colour: values.colour, timezone },
      },
      {
        onError: (error) => {
          if (!(error instanceof ApiError)) return;
          // Show the first step again when one of its fields needs fixing, so it can take focus.
          if (failedFields(error).some((field) => isFamilyStepField(field))) {
            flushSync(() => {
              setStep("family");
            });
          }
          if (error.code === "email_taken") {
            form.setError(
              "email",
              { type: "server", message: error.message },
              { shouldFocus: true },
            );
          } else {
            applyFieldErrors(error, form.setError, SERVER_FIELDS);
          }
        },
      },
    );
  });

  const formError =
    register.error && !(register.error instanceof ApiError && isPlacedOnField(register.error))
      ? register.error
      : null;

  return (
    <CenteredLayout
      title={step === "family" ? "Create your family" : "Your profile"}
      description={
        step === "family"
          ? "Step 1 of 2: the family account everyone signs in with."
          : "Step 2 of 2: you are the family's owner and first parent."
      }
      footer={
        <p className="text-sm text-muted-foreground">
          Already have a family?
          <Button variant="link" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </p>
      }
    >
      <form noValidate onSubmit={(event) => void onSubmit(event)} className="grid gap-4">
        {rateLimitedUntil !== undefined ? (
          <Banner tone="error" title="Too many attempts">
            Try again in{" "}
            <Countdown
              key={rateLimitedUntil}
              until={rateLimitedUntil}
              onEnd={() => register.reset()}
            />
            .
          </Banner>
        ) : (
          formError && <Banner tone="error">{errorMessage(formError)}</Banner>
        )}

        {step === "family" ? (
          <>
            <TextField
              label="Family email"
              description="Used to sign in. Any adult's address works."
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...form.register("email")}
            />
            <TextField
              label="Password"
              description="At least 10 characters."
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              {...form.register("password")}
            />
            <TextField
              label="Family name"
              autoComplete="off"
              error={errors.familyName?.message}
              {...form.register("familyName")}
            />
            <Button type="button" size="touch" onClick={() => void next()}>
              Next
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="Your name"
              autoComplete="given-name"
              error={errors.ownerName?.message}
              {...form.register("ownerName")}
            />
            <Controller
              control={form.control}
              name="colour"
              render={({ field, fieldState }) => (
                <ColourPicker
                  legend="Your colour"
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            <p className="text-sm text-muted-foreground">
              Time zone: <span className="font-medium text-foreground">{timezone}</span>, from this
              device.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="touch"
                onClick={() => {
                  setStep("family");
                }}
              >
                Back
              </Button>
              <Button
                type="submit"
                size="touch"
                disabled={register.isPending || rateLimitedUntil !== undefined}
              >
                {register.isPending ? "Creating…" : "Create family"}
              </Button>
            </div>
          </>
        )}
      </form>
    </CenteredLayout>
  );
}

/** The form fields a failed registration points at. */
function failedFields(error: ApiError): string[] {
  if (error.code === "email_taken") return ["email"];
  if (error.code !== "validation_failed") return [];
  return Object.keys(error.fields).flatMap((field) => SERVER_FIELDS[field] ?? []);
}

function isFamilyStepField(field: string): boolean {
  return FAMILY_STEP_FIELDS.some((name) => name === field);
}

/** Errors shown next to a field rather than as a banner. */
function isPlacedOnField(error: ApiError): boolean {
  if (error.code === "email_taken") return true;
  return (
    error.code === "validation_failed" &&
    Object.keys(error.fields).every((field) => field in SERVER_FIELDS)
  );
}
