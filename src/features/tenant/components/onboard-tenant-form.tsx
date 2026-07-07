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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company / organization name
                </label>
                <input
                    {...register("name")}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Acme Rentals"
                />
                {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business email
                </label>
                <input
                    {...register("email")}
                    type="email"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="you@company.com"
                />
                {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone number
                </label>
                <input
                    {...register("phoneNumber")}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="+254700000000"
                />
                {errors.phoneNumber && (
                    <p className="text-sm text-red-600 mt-1">
                        {errors.phoneNumber.message}
                    </p>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-gray-400">(optional)</span>
                </label>
                <input
                    {...register("address")}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    placeholder="123 Main St, Nairobi"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account type
                </label>
                <select
                    {...register("tenantType")}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                >
                    <option value={TenantType.TRIAL}>Trial</option>
                    <option value={TenantType.STANDARD}>Standard</option>
                    <option value={TenantType.PREMIUM}>Premium</option>
                    <option value={TenantType.ENTERPRISE}>Enterprise</option>
                </select>
                {errors.tenantType && (
                    <p className="text-sm text-red-600 mt-1">
                        {errors.tenantType.message}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded bg-gray-900 text-white text-sm font-medium py-2 disabled:opacity-50"
            >
                {mutation.isPending ? "Setting up your account…" : "Create my account"}
            </button>
        </form>
    );
}