import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./Button.js";
import { expectNoSeriousA11yViolations } from "../test/axe.js";

describe("Button", () => {
  it("renders a button element by default", () => {
    render(<Button>Start a project</Button>);
    const el = screen.getByRole("button", { name: "Start a project" });
    expect(el.tagName).toBe("BUTTON");
    expect(el.className).toContain("cursor-pointer");
  });

  it("renders an anchor when an href is given", () => {
    render(<Button href="/contact">Start a project</Button>);
    const el = screen.getByRole("link", { name: "Start a project" });
    expect(el.tagName).toBe("A");
    expect(el.getAttribute("href")).toBe("/contact");
  });

  it("applies the secondary variant classes", () => {
    render(
      <Button variant="secondary" href="/services">
        Find the right service
      </Button>,
    );
    const el = screen.getByRole("link", { name: "Find the right service" });
    expect(el.className).toContain("border");
  });

  it("has no serious accessibility violations", async () => {
    const { container } = render(
      <Button href="/contact">Start a project</Button>,
    );
    await expectNoSeriousA11yViolations(container);
  });
});
