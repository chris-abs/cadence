import type { ReactNode, SubmitEvent } from "react";

interface FormProps {
  /** Usually react-hook-form's `handleSubmit(...)`; a returned promise is not awaited. */
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => unknown;
  children: ReactNode;
}

/**
 * A form laid out as a column of fields. Browser validation is off: the
 * fields show the app's own messages, linked to each input.
 */
export function Form({ onSubmit, children }: FormProps) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="grid gap-4"
    >
      {children}
    </form>
  );
}
