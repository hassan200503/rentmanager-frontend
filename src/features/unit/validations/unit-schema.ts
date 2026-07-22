import { z } from "zod";

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

    label: optionalText,

    floor: optionalText,

    rentAmount: z.coerce
        .number()
        .positive("Rent amount must be greater than 0"),

    depositAmount: z.coerce
        .number()
        .nonnegative("Deposit amount cannot be negative"),

    description: optionalText,
});

export type UnitFormValues = z.infer<typeof unitSchema>;