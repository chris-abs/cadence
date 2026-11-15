import { type ComponentProps, type ReactNode, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Wiring a control needs to be labelled and described by its field. */
export interface FieldControlProps {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
}

interface FormFieldProps {
  label: string;
  /** Help shown under the control. */
  description?: string;
  /** Validation message; marks the control invalid. */
  error?: string;
  /** Renders the control with the ids that tie it to the label and messages. */
  children: (control: FieldControlProps) => ReactNode;
}

/**
 * A labelled form control with optional help and error text. The error is
 * linked through `aria-describedby`, so it is read when the control is focused.
 */
export function FormField({ label, description, error, children }: FormFieldProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = Omit<ComponentProps<"input">, "className" | "style" | "id" | "children" | "size">;

interface TextFieldProps extends InputProps {
  label: string;
  description?: string;
  error?: string;
}

/**
 * A labelled text input. Pass react-hook-form's `register(...)` result straight
 * in: the input is uncontrolled, so typing re-renders nothing.
 */
export function TextField({ label, description, error, ...inputProps }: TextFieldProps) {
  return (
    <FormField label={label} description={description} error={error}>
      {(control) => <Input size="touch" {...inputProps} {...control} />}
    </FormField>
  );
}
