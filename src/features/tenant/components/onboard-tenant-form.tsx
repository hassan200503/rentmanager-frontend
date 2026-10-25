"use client";

import { useForm, Resolver } from "react-hook-form";
import { z } from "zod";
import { useOnboardTenantMutation } from "../queries/use-onboard-tenant-mutation";
import { TenantType } from "../types/tenant-types";

const onboardTenantSchema = z.object({
    name: z.string().min(2, "Organisation name must be at least 2 characters"),
    email: z.string().email("Enter a valid business email"),
    phoneNumber: z
        .string()
        .min(7, "Enter a valid phone number")
        .max(20, "Enter a valid phone number"),
    address: z.string().optional(),
});

type OnboardTenantFormValues = z.infer<typeof onboardTenantSchema>;

// Manual resolver — @hookform/resolvers is not in package.json.
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
        defaultValues: { name: "", email: "", phoneNumber: "", address: "" },
    });

    const onSubmit = (values: OnboardTenantFormValues) => {
        // All new landlords start on the free trial; plan selection happens
        // after they experience the product — not during initial setup.
        mutation.mutate({ ...values, tenantType: TenantType.TRIAL });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="form-label" htmlFor="org-name">
                    Organisation name
                </label>
                <input
                    id="org-name"
                    {...register("name")}
                    className="form-input"
                    placeholder="Acme Rentals"
                    autoFocus
                    autoComplete="organization"
                />
                {errors.name && (
                    <p className="text-sm text-danger-dark dark:text-danger mt-1">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label className="form-label" htmlFor="org-email">
                    Business email
                </label>
                <input
                    id="org-email"
                    {...register("email")}
                    type="email"
                    className="form-input"
                    placeholder="you@company.com"
                    autoComplete="email"
                />
                {errors.email && (
                    <p className="text-sm text-danger-dark dark:text-danger mt-1">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label className="form-label" htmlFor="org-phone">
                    Phone number
                </label>
                <input
                    id="org-phone"
                    {...register("phoneNumber")}
                    className="form-input"
                    placeholder="+254700000000"
                    autoComplete="tel"
                />
                {errors.phoneNumber && (
                    <p className="text-sm text-danger-dark dark:text-danger mt-1">
                        {errors.phoneNumber.message}
                    </p>
                )}
            </div>

            <div>
                <label className="form-label" htmlFor="org-address">
                    Address <span className="text-fg-muted dark:text-fg-muted-dark font-normal">(optional)</span>
                </label>
                <input
                    id="org-address"
                    {...register("address")}
                    className="form-input"
                    placeholder="123 Main St, Nairobi"
                    autoComplete="street-address"
                />
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn-primary w-full mt-2"
            >
                {mutation.isPending ? "Creating your workspace…" : "Create workspace"}
            </button>

            <p className="text-xs text-center text-fg-muted dark:text-fg-muted-dark">
                Free 30-day trial &mdash; no credit card required.
            </p>
        </form>
    );
}
