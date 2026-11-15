import { cn } from "cn";
import { Check } from "lucide-react";
import { useId } from "react";
import {
  colourLabel,
  PROFILE_COLOURS,
  profileColourClasses,
  type ProfileColour,
} from "./profile-colours";

interface ColourPickerProps {
  legend: string;
  value: ProfileColour | undefined;
  onChange: (colour: ProfileColour) => void;
  error?: string;
}

/** A radio group of profile colour swatches; arrow keys move between them. */
export function ColourPicker({ legend, value, onChange, error }: ColourPickerProps) {
  const name = useId();
  const errorId = error ? `${name}-error` : undefined;
  return (
    <fieldset className="grid gap-2" aria-describedby={errorId}>
      <legend className="pb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {PROFILE_COLOURS.map((colour) => (
          <label
            key={colour}
            className={cn(
              "relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-background has-checked:ring-2 has-checked:ring-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring",
              profileColourClasses[colour],
            )}
          >
            <input
              type="radio"
              name={name}
              value={colour}
              checked={value === colour}
              onChange={() => {
                onChange(colour);
              }}
              className="sr-only"
            />
            <span className="sr-only">{colourLabel(colour)}</span>
            {value === colour && <Check aria-hidden className="size-4" />}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
