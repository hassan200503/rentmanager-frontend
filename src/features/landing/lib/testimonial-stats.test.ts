// features/landing/lib/testimonial-stats.test.ts
import { describe, expect, it } from "vitest";
import { averageRating, MIN_REVIEWS_TO_SHOW_AVERAGE } from "./testimonial-stats";

describe("averageRating", () => {
    it("returns null when fewer than 3 reviews exist", () => {
        expect(averageRating([])).toBeNull();
        expect(averageRating([{ rating: 5 }, { rating: 4 }])).toBeNull();
        expect(MIN_REVIEWS_TO_SHOW_AVERAGE).toBe(3);
    });

    it("averages 3+ reviews rounded to one decimal", () => {
        expect(averageRating([{ rating: 5 }, { rating: 5 }, { rating: 4 }])).toBe(4.7);
        expect(averageRating([{ rating: 1 }, { rating: 2 }, { rating: 3 }, { rating: 4 }])).toBe(2.5);
    });

    it("ignores out-of-range or non-numeric ratings", () => {
        expect(averageRating([{ rating: 9 }, { rating: 0 }, { rating: 5 }, { rating: 4 }, { rating: 3 }])).toBe(4);
    });
});