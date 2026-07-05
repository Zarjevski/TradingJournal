function toDate(date: Date | string): Date {
  return typeof date === "string" ? new Date(date) : date;
}

/** e.g. "Jan 5, 2026" — full date, short month. Used for trade dates, list rows. */
export function formatDate(date: Date | string): string {
  return toDate(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** e.g. "Jan 5" — compact date with no year, for chart axis labels. */
export function formatShortDate(date: Date | string): string {
  return toDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Locale-default date (e.g. "1/5/2026") — matches the browser's default toLocaleDateString(). */
export function formatSimpleDate(date: Date | string): string {
  return toDate(date).toLocaleDateString("en-US");
}
