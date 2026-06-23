import { z } from "zod";
import { UnitStatus } from "../types/unit";

const optionalText = z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined);

export const unitSchema = z.object({
    propertyId: z.string().min(1, "Property is required"),

    unitNumber: z
        .string()
        .trim()
        .min(1, "Unit number is required")
        .max(20, "Unit number must be at most 20 characters"),

    status: z.nativeEnum(UnitStatus),

    monthlyRent: z.coerce
        .number()
        .positive("Monthly rent must be greater than 0"),

    depositAmount: z.coerce
        .number()
        .min(0, "Deposit amount cannot be negative"),

    bedrooms: z.coerce
        .number()
        .int("Bedrooms must be a whole number")
        .min(0, "Bedrooms cannot be negative"),

    bathrooms: z.coerce
        .number()
        .int("Bathrooms must be a whole number")
        .min(0, "Bathrooms cannot be negative"),

    squareFootage: z.coerce
        .number()
        .positive("Square footage must be greater than 0")
        .optional()
        .or(z.literal("").transform(() => undefined)),

    description: optionalText,

    imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type UnitFormValues = z.infer<typeof unitSchema>;