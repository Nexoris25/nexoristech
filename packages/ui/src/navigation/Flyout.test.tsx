import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Flyout } from "./Flyout.js";
import { MegaMenu, MegaMenuItem } from "./MegaMenu.js";
import { expectNoSeriousA11yViolations } from "../test/axe.js";

function ServicesFlyout() {
  return (
    <Flyout label="Services">
      <MegaMenu columns={2}>
        <MegaMenuItem
          href="/ai-product-development"
          label="AI Product Development"
          description="Custom software."
        />
        <MegaMenuItem
          href="/ai-chatbots-virtual-assistants"
          label="AI Chatbots"
          description="Answer customers any time."
        />
      </MegaMenu>
    </Flyout>
  );
}

describe("Flyout", () => {
  it("starts closed with aria-expanded false", () => {
    render(<ServicesFlyout />);
    const trigger = screen.getByRole("button", { name: "Services" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens on click and exposes the panel", () => {
    render(<ServicesFlyout />);
    const trigger = screen.getByRole("button", { name: "Services" });
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByRole("link", { name: /AI Product Development/ }),
    ).toBeDefined();
  });

  it("opens on ArrowDown", () => {
    render(<ServicesFlyout />);
    const trigger = screen.getByRole("button", { name: "Services" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("closes on Escape and returns focus to the trigger", () => {
    render(<ServicesFlyout />);
    const trigger = screen.getByRole("button", { name: "Services" });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("has no serious accessibility violations when open", async () => {
    const { container } = render(<ServicesFlyout />);
    fireEvent.click(screen.getByRole("button", { name: "Services" }));
    await expectNoSeriousA11yViolations(container);
  });
});
