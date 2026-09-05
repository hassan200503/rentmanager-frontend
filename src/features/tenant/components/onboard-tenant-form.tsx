"use client";

import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { useOnboardTenantMutation } from "../queries/use-onboard-tenant-mutation";
import { TenantType } from "../types/tenant-types";

// Mirrors OnboardingTenantRequest (tenant-types.ts). `address` optional there,
// so optional here too — not enforcing a stricter frontend rule than the DTO.
//
// NOTE: zod v4 (see package.json: "zod": "^4.4.3") renamed the custom-message
// option on z.nativeEnum from `errorMap` to `error`. Using `error` below.
const onboardTenantSchema = z.object({
    name: z.string().min(2, "Company name is required"),
    email: z.string().email("Enter a valid email"),
    phoneNumber: z
        .string()
        .min(7, "Enter a valid phone number")
        .max(20, "Enter a valid phone number"),
    address: z.string().optional(),
    tenantType: z.nativeEnum(TenantType, {
        error: () => "Select an account type",
    }),
});

type OnboardTenantFormValues = z.infer<typeof onboardTenantSchema>;

// Manual resolver replacing @hookform/resolvers/zod, which is NOT present
// in package.json (only bare `zod` + `react-hook-form` are listed — confirmed
// by the TS2307 module-not-found error). Avoids adding an unrequested
// dependency. If @hookform/resolvers gets installed later, this can be
// swapped back for `zodResolver(onboardTenantSchema)` with no other changes.
const resolver: Resolver<OnboardTenantFormValues> = async (values) => {
    const result = onboardTenantSchema.safeParse(values);

    if (result.success) {
        return { values: result.data, errors: {} };
    }

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!errors[path]) {
            errors[path] = { type: issue.code, message: issue.message };
        }
    }

    return { values: {}, errors };
};

export function OnboardTenantForm() {
    const mutation = useOnboardTenantMutation();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<OnboardTenantFormValues>({
        resolver,
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            address: "",
            tenantType: TenantType.TRIAL,
        },
    });

    const onSubmit = (values: OnboardTenantFormValues) => {
        mutation.mutate(values);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="form-label">
                    Company / organization name
                </label>
                <input
                    {...register("name")}
                    className="form-input"
                    placeholder="Acme Rentals"
                />
                {errors.name && (
                    <p className="text-sm text-danger-dark dark:text-danger mt-1">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label className="form-label">
                    Business email
                </label>
                <input
                    {...register("email")}
                    type="email"
                    className="form-input"
                    placeholder="you@company.com"
                />
                {errors.email && (
                    <p className="text-sm text-danger-dark dark:text-danger mt-1">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label className="form-label">
                    Phone number
                </label>
                <input
                    {...register("phoneNumber")}
                    className="form-input"
                    placeholder="+254700000000"
                />
                {errors.phoneNumber && (
                    <p className="text-sm text-danger-dark dark:text-danger mt-1">
                        {errors.phoneNumber.message}
                    </p>
                )}
            </div>

            <div>
                <label className="form-label">
                    Address <span className="text-ink-muted dark:text-ink-muted-dark">(optional)</span>
                </label>
                <input
                    {...register("address")}
                    className="form-input"
                    placeholder="123 Main St, Nairobi"
                />
            </div>

            <div>
                <label className="form-label">
                    Account type
                </label>
                <select
                    {...register("tenantType")}
                    className="form-input"
                >
                    <option value={TenantType.TRIAL}>Trial</option>
                    <option value={TenantType.STANDARD}>Standard</option>
                    <option value={TenantType.PREMIUM}>Premium</option>
                    <option value={TenantType.ENTERPRISE}>Enterprise</option>
                </select>
                {errors.tenantType && (
                    <p className="text-sm text-danger-dark dark:text-danger mt-1">
                        {errors.tenantType.message}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn-primary w-full"
            >
                {mutation.isPending ? "Setting up your account…" : "Create my account"}
            </button>
        </form>
    );
}
