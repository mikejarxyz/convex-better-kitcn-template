export type LabelCase = "title" | "sentence" | "lower";

interface FormatLabelOptions {
  case?: LabelCase;
}

export function formatLabelToken(
  value: string,
  options: FormatLabelOptions = {},
): string {
  const compact = value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!compact) return "";

  const normalized = compact.toLowerCase();
  const casing = options.case ?? "title";

  if (casing === "lower") {
    return normalized;
  }

  if (casing === "sentence") {
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}
