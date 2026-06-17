/**
 * Responsive table for the Nexoris Technologies platform (PRD 14.8).
 *
 * Tables never break the page width. On wide screens they render as a standard table with a
 * sticky header. Below the medium breakpoint they switch to one of two patterns chosen per
 * table: a stacked-card layout where each row becomes a labelled card, or a horizontally
 * scrollable container with a frozen first column and a visible scroll affordance. Numeric and
 * money columns use JetBrains Mono and right-align. Every table has a caption, header cells
 * with scope, and a row count announced to assistive technology, and stays readable at 280px.
 */
import type { ReactNode } from "react";
import { cn } from "../utils/cn.js";

export interface TableColumn<T> {
  /** A stable key for the column. */
  key: string;
  /** The header label. */
  header: string;
  /** Render the cell for a row. Defaults to String(row[key]). */
  render: (row: T) => ReactNode;
  /** Numeric or money columns use JetBrains Mono and right-align. */
  numeric?: boolean;
}

export type TablePattern = "stacked" | "scroll";

export interface ResponsiveTableProps<T> {
  /** The accessible caption naming the table. */
  caption: string;
  columns: TableColumn<T>[];
  rows: T[];
  /** A stable key per row. */
  getRowKey: (row: T) => string;
  /** The small-screen pattern. Defaults to stacked. */
  pattern?: TablePattern;
  className?: string;
}

function cellClass(numeric?: boolean): string {
  return cn(
    "px-4 py-3 text-dash-data align-top",
    numeric ? "text-right font-mono tabular-nums" : "text-left",
  );
}

export function ResponsiveTable<T>({
  caption,
  columns,
  rows,
  getRowKey,
  pattern = "stacked",
  className,
}: ResponsiveTableProps<T>): ReactNode {
  const rowCountNote = `${rows.length} ${rows.length === 1 ? "row" : "rows"}`;

  const fullTable = (
    <table className="w-full border-collapse text-ink-950">
      <caption className="sr-only">
        {caption}. {rowCountNote}.
      </caption>
      <thead>
        <tr className="border-b border-purple-200 bg-purple-100">
          {columns.map((column, index) => (
            <th
              key={column.key}
              scope="col"
              className={cn(
                "px-4 py-3 text-dash-table-header font-600 uppercase text-neutral-600",
                column.numeric ? "text-right" : "text-left",
                pattern === "scroll" &&
                  index === 0 &&
                  "sticky left-0 bg-purple-100",
              )}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={getRowKey(row)} className="border-b border-purple-200">
            {columns.map((column, index) => {
              const isRowHeader = index === 0;
              const content = column.render(row);
              if (isRowHeader) {
                return (
                  <th
                    key={column.key}
                    scope="row"
                    className={cn(
                      cellClass(column.numeric),
                      "font-600",
                      pattern === "scroll" && "sticky left-0 bg-white",
                    )}
                  >
                    {content}
                  </th>
                );
              }
              return (
                <td key={column.key} className={cellClass(column.numeric)}>
                  {content}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (pattern === "scroll") {
    return (
      <div
        role="region"
        aria-label={caption}
        tabIndex={0}
        className={cn(
          "w-full overflow-x-auto rounded-card border border-purple-200",
          className,
        )}
      >
        {fullTable}
      </div>
    );
  }

  // Stacked pattern: the real table on medium and up, labelled cards below.
  return (
    <div className={className}>
      <div className="hidden overflow-hidden rounded-card border border-purple-200 md:block">
        {fullTable}
      </div>
      <ul
        className="flex flex-col gap-4 md:hidden"
        aria-label={`${caption}. ${rowCountNote}.`}
      >
        {rows.map((row) => (
          <li
            key={getRowKey(row)}
            className="rounded-card border border-purple-200 bg-white p-4"
          >
            <dl className="flex flex-col gap-2">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between gap-4">
                  <dt className="text-dash-table-header font-600 uppercase text-neutral-600">
                    {column.header}
                  </dt>
                  <dd
                    className={cn(
                      "text-dash-data text-ink-950",
                      column.numeric && "font-mono tabular-nums",
                    )}
                  >
                    {column.render(row)}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
