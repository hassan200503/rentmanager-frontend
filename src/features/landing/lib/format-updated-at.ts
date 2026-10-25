/**
 * Human "updated X ago" phrasing for the coverage-map verified-count readout.
 * Returns the relative fragment WITHOUT a leading "updated" — e.g. "12 min ago".
 */
export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "recently";

  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;

  const months = Math.round(days / 30);
  return `${months} mo ago`;
}
