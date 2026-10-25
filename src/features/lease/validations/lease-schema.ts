import { z } from "zod";

export const leaseSchema = z
    .object({
        propertyId: z.string().min(1, "Select a property"),
        unitId: z.string().min(1, "Select a unit"),
        tenantProfileId: z
            .string()
            .trim()
            .min(1, "Tenant profile ID is required"),
        leaseNumber: z
            .string()
            .trim()
            .min(1, "Lease number is required")
            .max(50, "Lease number must be at most 50 characters"),
        leaseType: z.enum(["STANDARD", "FIXED_TERM", "MONTH_TO_MONTH"], {
            error: () => "Select a lease type",
        }),
        billingCycle: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"], {
            error: () => "Select a billing cycle",
        }),
        startDate: z.string().min(1, "Start date is required"),
        endDate: z.string().min(1, "End date is required"),
        rentAmount: z.coerce
            .number()
            .positive("Rent amount must be greater than 0"),
        securityDeposit: z.coerce
            .number()
            .nonnegative("Security deposit cannot be negative"),
        lateFeeAmount: z.coerce
            .number()
            .nonnegative("Late fee cannot be negative"),
        gracePeriodDays: z.coerce
            .number()
            .int("Grace period must be a whole number")
            .nonnegative("Grace period cannot be negative"),
        autoRenew: z.boolean(),
    })
    .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
        path: ["endDate"],
        message: "End date must be after the start date",
    });

export type LeaseFormValues = z.infer<typeof leaseSchema>;
