import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DataState } from "./states.js";
import { ResponsiveTable } from "./Table.js";
import { expectNoSeriousA11yViolations } from "../test/axe.js";

const emptyCopy = {
  title: "Nothing here yet",
  message: "When there is something to show, it will appear here.",
};

describe("DataState", () => {
  it("renders populated children", () => {
    render(
      <DataState status="populated" empty={emptyCopy}>
        <p>Real content</p>
      </DataState>,
    );
    expect(screen.getByText("Real content")).toBeDefined();
  });

  it("renders the empty state with the approved copy", () => {
    render(
      <DataState status="empty" empty={emptyCopy}>
        <p>Real content</p>
      </DataState>,
    );
    expect(screen.getByText("Nothing here yet")).toBeDefined();
    expect(screen.queryByText("Real content")).toBeNull();
  });

  it("renders an alert in the error state", () => {
    render(
      <DataState
        status="error"
        empty={emptyCopy}
        error={{ message: "Please try again." }}
      >
        <p>Real content</p>
      </DataState>,
    );
    expect(screen.getByRole("alert")).toBeDefined();
  });

  it("marks the loading state as busy", () => {
    const { container } = render(
      <DataState status="loading" empty={emptyCopy}>
        <p>Real content</p>
      </DataState>,
    );
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});

interface Row {
  service: string;
  price: string;
}

const columns = [
  { key: "service", header: "Service", render: (r: Row) => r.service },
  {
    key: "price",
    header: "Price from",
    render: (r: Row) => r.price,
    numeric: true,
  },
];

const rows: Row[] = [
  { service: "Website", price: "₦450,000" },
  { service: "Mobile app", price: "₦1,200,000" },
];

describe("ResponsiveTable", () => {
  it("renders a caption with the row count and scoped headers", () => {
    render(
      <ResponsiveTable
        caption="Pricing guidance"
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.service}
        pattern="scroll"
      />,
    );
    expect(screen.getByText(/Pricing guidance\. 2 rows\./)).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Service" })).toBeDefined();
  });

  it("has no serious accessibility violations in the scroll pattern", async () => {
    const { container } = render(
      <ResponsiveTable
        caption="Pricing guidance"
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.service}
        pattern="scroll"
      />,
    );
    await expectNoSeriousA11yViolations(container);
  });

  it("has no serious accessibility violations in the stacked pattern", async () => {
    const { container } = render(
      <ResponsiveTable
        caption="Pricing guidance"
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.service}
        pattern="stacked"
      />,
    );
    await expectNoSeriousA11yViolations(container);
  });
});
