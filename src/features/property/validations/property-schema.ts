import { z } from "zod";
import { PremisesType, PropertyType } from "../types/property";

const optionalText = z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined);

export const propertySchema = z
    .object({
        name: z.string().trim().min(2, "Property name must be at least 2 characters"),
        propertyType: z.nativeEnum(PropertyType),

        // Optional override — omitted => backend derives from propertyType
        // (COMMERCIAL/OFFICE/WAREHOUSE -> COMMERCIAL, else RESIDENTIAL).
        // MIXED_USE is only reachable via this override.
        premisesType: z.nativeEnum(PremisesType).optional(),

        // Mandatory whenever premisesType is provided — the classification is
        // a legal/tax attribute driving the MRI/VAT pipeline, so every
        // explicit deviation from the auto-derivation needs a justification.
        premisesTypeOverrideReason: optionalText,

        description: optionalText,

        address: z.object({
            streetAddress: z.string().trim().min(1, "Street address is required"),
            city: z.string().trim().min(1, "City is required"),
            state: optionalText,
            postalCode: optionalText,
            country: z.string().trim().min(1, "Country is required"),
        }),

        geoLocation: z.object({
            latitude: z.coerce.number().min(-90).max(90),
            longitude: z.coerce.number().min(-180).max(180),
        }),

        dimensions: z
            .object({
                totalArea: z.coerce.number().positive("Total area must be greater than 0"),
                occupiedArea: z.coerce.number().min(0, "Occupied area cannot be negative"),
                unitCount: z.coerce.number().int().min(0, "Unit count cannot be negative"),
            })
            .refine((value) => value.occupiedArea <= value.totalArea, {
                path: ["occupiedArea"],
                message: "Occupied area cannot exceed total area",
            }),
    })
    .superRefine((value, ctx) => {
        if (value.premisesType) {
            const reason = (value.premisesTypeOverrideReason ?? "").trim();
            if (!reason) {
                ctx.addIssue({
                    code: "custom",
                    path: ["premisesTypeOverrideReason"],
                    message:
                        "A reason is required when you override the premises type (tax classification)",
                });
            } else if (reason.length > 500) {
                ctx.addIssue({
                    code: "custom",
                    path: ["premisesTypeOverrideReason"],
                    message: "Reason must not exceed 500 characters",
                });
            }
        } else if (value.premisesTypeOverrideReason) {
            ctx.addIssue({
                code: "custom",
                path: ["premisesTypeOverrideReason"],
                message: "A reason is only allowed when you choose a premises type override",
            });
        }
    });

export type PropertyFormValues = z.infer<typeof propertySchema>;
