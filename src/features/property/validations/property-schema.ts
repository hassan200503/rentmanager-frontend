import { z } from "zod";
import { PropertyType } from "../types/property";

const optionalText = z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined);

export const propertySchema = z.object({
    name: z.string().trim().min(2, "Property name must be at least 2 characters"),
    propertyType: z.nativeEnum(PropertyType),

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

    dimensions: z.object({
        totalArea: z.coerce.number().positive("Total area must be greater than 0"),
        occupiedArea: z.coerce.number().min(0, "Occupied area cannot be negative"),
        unitCount: z.coerce.number().int().min(0, "Unit count cannot be negative"),
    }).refine((value) => value.occupiedArea <= value.totalArea, {
        path: ["occupiedArea"],
        message: "Occupied area cannot exceed total area",
    }),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;
