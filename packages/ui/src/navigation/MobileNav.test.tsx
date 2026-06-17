import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MobileNav } from "./MobileNav.js";
import { AccordionItem } from "./Accordion.js";
import { FloatingTableOfContents } from "./FloatingTableOfContents.js";
import { expectNoSeriousA11yViolations } from "../test/axe.js";

describe("MobileNav", () => {
  it("opens the dialog from the hamburger and closes on the close button", () => {
    render(
      <MobileNav>
        <AccordionItem title="Services">
          <a href="/ai-product-development">AI Product Development</a>
        </AccordionItem>
      </MobileNav>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog", { name: "Menu" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("toggles an accordion section", () => {
    render(
      <MobileNav>
        <AccordionItem title="Services">
          <a href="/ai-product-development">AI Product Development</a>
        </AccordionItem>
      </MobileNav>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const sectionToggle = screen.getByRole("button", { name: "Services" });
    expect(sectionToggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(sectionToggle);
    expect(sectionToggle.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("FloatingTableOfContents", () => {
  const sections = [
    { id: "intro", title: "Introduction" },
    { id: "cost", title: "What it costs" },
  ];

  it("renders nothing when there are no sections", () => {
    const { container } = render(<FloatingTableOfContents sections={[]} />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("opens a dialog and lists the sections", () => {
    render(<FloatingTableOfContents sections={sections} />);
    fireEvent.click(screen.getByRole("button", { name: "Jump to a section" }));
    expect(
      screen.getByRole("dialog", { name: "Jump to a section" }),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: "What it costs" })).toBeDefined();
  });

  it("has no serious accessibility violations when open", async () => {
    const { container } = render(
      <FloatingTableOfContents sections={sections} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Jump to a section" }));
    await expectNoSeriousA11yViolations(container);
  });
});
