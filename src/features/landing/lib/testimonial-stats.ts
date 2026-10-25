// features/landing/lib/testimonial-stats.ts
// Pure average-rating math shared by the landing testimonials wall.
// Mirrors the platform rule: averages are only shown from 3+ rated reviews.

export const MIN_REVIEWS_TO_SHOW_AVERAGE = 3;

export interface RatedItem {
    rating: number;
}

export function averageRating(items: RatedItem[]): number | null {
    const valid = items.filter((i) => Number.isFinite(i.rating) && i.rating >= 1 && i.rating <= 5);
    if (valid.length < MIN_REVIEWS_TO_SHOW_AVERAGE) return null;
    const sum = valid.reduce((acc, i) => acc + i.rating, 0);
    return Math.round((sum / valid.length) * 10) / 10;
}