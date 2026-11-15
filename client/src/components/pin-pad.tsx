import { cva } from "class-variance-authority";
import { Delete } from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";

export const PIN_LENGTH = 6;
const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

/**
 * The digits typed so far, outside React state: only the dots subscribe, so a
 * key press re-renders the dots and nothing else (not the keypad, not the page).
 */
function createPinStore() {
  let value = "";
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: string) => {
      if (next === value) return;
      value = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
type PinStore = ReturnType<typeof createPinStore>;

const dotVariants = cva("size-4 rounded-full border-2 transition-colors", {
  variants: {
    state: {
      empty: "border-muted-foreground/40",
      filled: "border-primary bg-primary",
      invalid: "border-destructive",
    },
  },
});

interface PinDotsProps {
  store: PinStore;
  inputId: string;
  describedBy: string | undefined;
  invalid: boolean;
  disabled: boolean;
  busy: boolean;
  onInput: (next: string) => void;
}

/** The six dots, plus the real input that keyboards and screen readers type into. */
function PinDots({ store, inputId, describedBy, invalid, disabled, busy, onInput }: PinDotsProps) {
  const value = useSyncExternalStore(store.subscribe, store.get);
  const inputRef = useRef<HTMLInputElement>(null);
  // The pad is the screen's only task: take focus when it appears or unlocks.
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);
  return (
    <div className="relative flex justify-center gap-3 rounded-lg p-3 has-focus-visible:ring-3 has-focus-visible:ring-ring/50">
      <input
        ref={inputRef}
        id={inputId}
        type="password"
        // No on-screen keyboard: the keypad below is the touch input.
        inputMode="none"
        autoComplete="off"
        maxLength={PIN_LENGTH}
        value={value}
        disabled={disabled}
        // Busy keeps focus where it is (a disabled input would drop it).
        readOnly={busy}
        aria-busy={busy || undefined}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => {
          onInput(event.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH));
        }}
        className="absolute inset-0 opacity-0"
      />
      {Array.from({ length: PIN_LENGTH }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={dotVariants({
            state: i < value.length ? "filled" : invalid ? "invalid" : "empty",
          })}
        />
      ))}
    </div>
  );
}

interface KeypadProps {
  disabled: boolean;
  busy: boolean;
  onDigit: (digit: string) => void;
  onDelete: () => void;
}

function Keypad({ disabled, busy, onDigit, onDelete }: KeypadProps) {
  return (
    <div className="grid grid-cols-3 justify-items-center gap-3">
      {DIGITS.map((digit) => (
        <Button
          key={digit}
          variant="secondary"
          size="keypad"
          disabled={disabled}
          aria-disabled={busy || undefined}
          onClick={() => {
            onDigit(digit);
          }}
        >
          {digit}
        </Button>
      ))}
      <span aria-hidden />
      <Button
        variant="secondary"
        size="keypad"
        disabled={disabled}
        aria-disabled={busy || undefined}
        onClick={() => {
          onDigit("0");
        }}
      >
        0
      </Button>
      <Button
        variant="ghost"
        size="keypad"
        disabled={disabled}
        aria-disabled={busy || undefined}
        aria-label="Delete last digit"
        onClick={onDelete}
      >
        <Delete aria-hidden />
      </Button>
    </div>
  );
}

interface PinPadProps {
  /** Names the PIN input, e.g. "PIN for Alex". */
  label: string;
  /** Called with all six digits; the pad then clears itself. */
  onComplete: (pin: string) => void;
  /** No entry at all, e.g. while locked out. */
  disabled?: boolean;
  /** Ignores entry but keeps focus, e.g. while a PIN is being checked. */
  busy?: boolean;
  /** Shows the dots in the error colour, e.g. after a wrong PIN. */
  invalid?: boolean;
  /** Id of a message that describes the input, e.g. the current error. */
  describedBy?: string;
}

/**
 * A six-digit PIN entry: on-screen keypad for touch, and a real (visually
 * hidden) password input for keyboards and screen readers. Digits typed on a
 * keyboard work wherever focus is inside the pad.
 */
export function PinPad({
  label,
  onComplete,
  disabled = false,
  busy = false,
  invalid = false,
  describedBy,
}: PinPadProps) {
  const [store] = useState(createPinStore);
  const inputId = useId();
  const inert = disabled || busy;

  function update(next: string) {
    if (inert) return;
    if (next.length < PIN_LENGTH) {
      store.set(next);
      return;
    }
    store.set("");
    onComplete(next);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    // The input handles its own typing; this covers focus on a keypad button.
    if (inert || event.target instanceof HTMLInputElement) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      update(store.get() + event.key);
    } else if (event.key === "Backspace") {
      event.preventDefault();
      store.set(store.get().slice(0, -1));
    }
  }

  return (
    // The handler only forwards keys typed while a keypad button has focus.
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="grid justify-items-center gap-4" onKeyDown={onKeyDown}>
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <PinDots
        store={store}
        inputId={inputId}
        describedBy={describedBy}
        invalid={invalid}
        disabled={disabled}
        busy={busy}
        onInput={update}
      />
      <Keypad
        disabled={disabled}
        busy={busy}
        onDigit={(digit) => {
          update(store.get() + digit);
        }}
        onDelete={() => {
          if (!inert) store.set(store.get().slice(0, -1));
        }}
      />
    </div>
  );
}
