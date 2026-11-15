import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Form } from "./form";
import { MessageSlot } from "./message-slot";
import { AvatarPlaceholder } from "./profile-avatar";
import { Stack } from "./stack";
import { Text, VisuallyHidden } from "./text";
import { Tile, TileList, TileListItem } from "./tile";

describe("Stack", () => {
  it("lays children out in a column by default, or a row", () => {
    const { container, rerender } = render(
      <Stack>
        <span>a</span>
        <span>b</span>
      </Stack>,
    );
    const stack = container.firstElementChild;
    expect(stack).toHaveClass("flex-col", "gap-4");

    rerender(
      <Stack direction="row" gap="sm" align="center">
        <span>a</span>
      </Stack>,
    );
    expect(stack).toHaveClass("flex-row", "gap-2", "items-center");
    expect(stack).toHaveAttribute("data-direction", "row");
  });
});

describe("Text", () => {
  it("renders a paragraph, or a span inside other text, in a tone", () => {
    render(
      <Text size="sm" tone="muted">
        Time zone:{" "}
        <Text as="span" weight="medium">
          Europe/London
        </Text>
      </Text>,
    );

    const inner = screen.getByText("Europe/London");
    expect(inner.tagName).toBe("SPAN");
    expect(inner).toHaveClass("font-medium");
    const outer = inner.parentElement;
    expect(outer?.tagName).toBe("P");
    expect(outer).toHaveClass("text-sm", "text-muted-foreground");
  });

  it("hides text visually but keeps it for screen readers", () => {
    render(
      <button type="button">
        <VisuallyHidden>Signed in as </VisuallyHidden>Jo
      </button>,
    );

    expect(screen.getByRole("button", { name: /^Signed in as\s*Jo$/ })).toBeInTheDocument();
    expect(screen.getByText("Signed in as")).toHaveClass("sr-only");
  });
});

describe("Form", () => {
  it("submits through its handler with browser validation off", async () => {
    const onSubmit = vi.fn<(event: unknown) => void>((event) => {
      if (event instanceof Event) event.preventDefault();
    });
    const { container } = render(
      <Form onSubmit={(event) => onSubmit(event.nativeEvent)}>
        <input aria-label="Email" type="email" required />
        <button type="submit">Send</button>
      </Form>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(container.querySelector("form")).toHaveAttribute("novalidate");
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe("Tile", () => {
  it("is a large button named by its title and hint, inside a list", async () => {
    const onSelect = vi.fn<() => void>();
    render(
      <TileList>
        <TileListItem>
          <Tile
            media={<span>A</span>}
            title="Alex"
            hint="PIN protected."
            detail="Locked"
            onSelect={onSelect}
          />
        </TileListItem>
      </TileList>,
    );

    expect(screen.getByRole("list")).toContainElement(screen.getByRole("listitem"));
    const tile = screen.getByRole("button", { name: "Alex" });
    expect(tile).toHaveAccessibleDescription("PIN protected. Locked");
    await userEvent.click(tile);
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("marks a busy tile and ignores taps when disabled", () => {
    const onSelect = vi.fn<() => void>();
    render(<Tile media={null} title="Sam" busy disabled onSelect={onSelect} />);

    const tile = screen.getByRole("button", { name: "Sam" });
    expect(tile).toHaveAttribute("aria-busy", "true");
    fireEvent.click(tile);
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("MessageSlot", () => {
  it("reserves room for a message and can be referenced by id", () => {
    const { container } = render(<MessageSlot id="pin-message" />);

    const slot = container.firstElementChild;
    expect(slot).toHaveAttribute("id", "pin-message");
    expect(slot).toHaveClass("min-h-18");
  });
});

describe("AvatarPlaceholder", () => {
  it("holds an avatar's place, hidden from screen readers", () => {
    const { container } = render(<AvatarPlaceholder size="lg" />);

    const placeholder = container.firstElementChild;
    expect(placeholder).toHaveAttribute("aria-hidden");
    expect(placeholder).toHaveClass("size-24", "bg-muted");
  });
});
