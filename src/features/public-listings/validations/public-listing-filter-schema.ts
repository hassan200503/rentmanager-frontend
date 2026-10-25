import { z } from "zod";

export const publicListingFilterSchema = z.object({
    keyword: z
        .string()
        .trim()
        .max(100)
        .optional(),

    page: z
        .number()
        .int()
        .min(0)
        .default(0),

    size: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),
});

export type PublicListingFilterInput =
    z.infer<typeof publicListingFilterSchema>;