/**
 * Convert an untrusted date string (RSS pubDate, API timestamp) to an ISO
 * string, falling back when it's missing or unparseable. A raw
 * `new Date(bad).toISOString()` throws `RangeError: Invalid time value`, and a
 * raw `Date.parse(bad)` yields `NaN` that poisons downstream recency math and
 * sort comparators - both turn one malformed feed item into a dropped feed.
 */
export function safeIso(
  value: string | number | undefined | null,
  fallbackIso: string,
): string {
  if (value === undefined || value === null || value === '') return fallbackIso;
  const ms = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : fallbackIso;
}
