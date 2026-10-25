import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatUpdatedAt } from "./format-updated-at";

describe("formatUpdatedAt", () => {
  const now = new Date("2026-08-15T12:00:00Z").getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders 'just now' under a minute", () => {
    expect(formatUpdatedAt(new Date(now - 30_000).toISOString())).toBe(
      "just now"
    );
  });

  it("renders minutes", () => {
    expect(formatUpdatedAt(new Date(now - 12 * 60_000).toISOString())).toBe(
      "12 min ago"
    );
  });

  it("renders hours", () => {
    expect(formatUpdatedAt(new Date(now - 3 * 3_600_000).toISOString())).toBe(
      "3 h ago"
    );
  });

  it("renders days", () => {
    expect(formatUpdatedAt(new Date(now - 4 * 86_400_000).toISOString())).toBe(
      "4 d ago"
    );
  });

  it("renders months", () => {
    expect(formatUpdatedAt(new Date(now - 45 * 86_400_000).toISOString())).toBe(
      "2 mo ago"
    );
  });

  it("falls back for invalid dates", () => {
    expect(formatUpdatedAt("not-a-date")).toBe("recently");
  });
});
