export type DateInput = string | number | Date | null | undefined;

export function getUserTimeZone() {
  return typeof Intl !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : undefined;
}

export function formatShortDateInUserTz(input: DateInput) {
  if (!input) return undefined;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return undefined;

  const timeZone = getUserTimeZone();

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone,
  }).format(d);
}

export function formatTimestampAsDate(value: unknown): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== "number") return String(value);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}
