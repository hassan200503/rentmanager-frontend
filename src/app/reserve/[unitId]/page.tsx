"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "@/features/public-listings/api/public-endpoints";

// --- Types ---
interface UnitDetails {
    unitNumber: string;
    propertyName: string;
    monthlyRent: number;
    depositAmount: number;
}

interface FormData {
    fullName: string;
    phone: string;
    email: string;
    nationalId: string;
    moveInDate: string;
    mpesaPhone: string;
}

interface FormErrors {
    fullName?: string;
    phone?: string;
    email?: string;
    nationalId?: string;
    moveInDate?: string;
    mpesaPhone?: string;
}

interface InitiateReservationResponse {
    paymentIntentId: string;
}

interface UnitSummaryResponse {
    unitId: string;
    unitNumber: string;
    propertyName: string;
    monthlyRent: number;
    depositAmount: number;
}

// --- Helpers ---
const formatKES = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

const validatePhone = (phone: string) => /^(?:\+?254|0)[71]\d{8}$/.test(phone.trim());

// Normalizes any accepted format (0712345678, 254712345678, +254712345678)
// into the +254XXXXXXXXX format the backend expects.
const normalizePhone = (phone: string) => {
    const trimmed = phone.trim();
    if (trimmed.startsWith("+254")) return trimmed;
    if (trimmed.startsWith("254")) return `+${trimmed}`;
    if (trimmed.startsWith("0")) return `+254${trimmed.slice(1)}`;
    return trimmed;
};
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// --- Component ---
export default function ReservationPage() {
    const { unitId } = useParams<{ unitId: string }>();
    const router = useRouter();

    const [unit, setUnit] = useState<UnitDetails | null>(null);
    const [unitLoading, setUnitLoading] = useState(true); // true by default — no setState in effect
    const [unitError, setUnitError] = useState<string | null>(null);

    const [form, setForm] = useState<FormData>({
        fullName: "",
        phone: "",
        email: "",
        nationalId: "",
        moveInDate: "",
        mpesaPhone: "",
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetch unit details
    useEffect(() => {
        if (!unitId) return;

        let cancelled = false;

        // FIXED (2026-07-08): previously a bare fetch('/api/v1/public/units/...')
        // — a relative path bypassing apiClient/appConfig.api.baseUrl, the
        // pattern every other public request in this app uses. That meant
        // this call hit the Next.js app's own origin instead of the actual
        // backend host, and would 404 in any deployment where they differ.
        // apiClient.get() also already unwraps the ApiResponse envelope, so
        // the manual success/data parsing that used to live here is gone.
        apiClient
            .get<UnitSummaryResponse>(publicEndpoints.unitReservationSummary(unitId))
            .then((data) => {
                if (cancelled) return;
                const { unitNumber, propertyName, monthlyRent, depositAmount } = data;
                setUnit({ unitNumber, propertyName, monthlyRent, depositAmount });
                setUnitLoading(false);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setUnitError(err instanceof Error ? err.message : "Failed to load unit details.");
                setUnitLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [unitId]);

    // Keep mpesaPhone in sync with phone by default
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const updated = { ...prev, [name]: value };
            if (name === "phone" && prev.mpesaPhone === prev.phone) {
                updated.mpesaPhone = value;
            }
            return updated;
        });
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const validate = (): boolean => {
        const errs: FormErrors = {};
        if (!form.fullName.trim()) errs.fullName = "Full name is required.";
        if (!validatePhone(form.phone)) errs.phone = "Enter a valid Kenyan number, e.g. 0712345678.";
        if (!validateEmail(form.email)) errs.email = "Enter a valid email address.";
        if (!form.nationalId.trim()) errs.nationalId = "National ID is required.";
        if (!form.moveInDate) errs.moveInDate = "Select your move-in date.";
        else if (new Date(form.moveInDate) < new Date(new Date().toDateString()))
            errs.moveInDate = "Move-in date must be today or later.";
        if (!validatePhone(form.mpesaPhone)) errs.mpesaPhone = "Enter the M-Pesa number that will pay the deposit, e.g. 0712345678.";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            // FIXED (2026-07-08): previously a bare fetch('/api/v1/public/reservations/initiate')
            // with manual JSON.stringify + manual ApiResponse envelope parsing.
            // apiClient.post() handles both the correct base URL and the
            // envelope unwrapping already, matching every other write call
            // in this codebase.
            const data = await apiClient.post<InitiateReservationResponse>(
                publicEndpoints.initiateReservation,
                {
                    unitId,
                    ...form,
                    phone: normalizePhone(form.phone),
                    mpesaPhone: normalizePhone(form.mpesaPhone),
                }
            );

            const { paymentIntentId } = data;
            if (!paymentIntentId) {
                throw new Error("Unexpected response from server.");
            }

            router.push(`/reserve/waiting?paymentIntentId=${paymentIntentId}`);
        } catch (err: unknown) {
            setSubmitError(err instanceof Error ? err.message : "Unexpected error.");
            setSubmitting(false);
        }
    };

    // --- Render: unit header states ---
    const renderUnitHeader = () => {
        if (unitLoading) {
            return (
                <div className="animate-pulse space-y-2 mb-8">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
            );
        }
        if (unitError || !unit) {
            return (
                <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {unitError ?? "Unable to load unit details."}
                </div>
            );
        }
        return (
            <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mb-1">
                    You are reserving
                </p>
                <h2 className="text-xl font-semibold text-gray-900">
                    Unit {unit.unitNumber} — {unit.propertyName}
                </h2>
                <div className="mt-3 flex flex-wrap gap-6 text-sm text-gray-600">
                    <span>
                        <span className="font-medium text-gray-800">Monthly rent:</span>{" "}
                        {formatKES(unit.monthlyRent)}
                    </span>
                    <span>
                        <span className="font-medium text-gray-800">Deposit due now:</span>{" "}
                        <span className="text-emerald-700 font-semibold">{formatKES(unit.depositAmount)}</span>
                    </span>
                </div>
            </div>
        );
    };

    // --- Field helper ---
    const field = (
        id: keyof FormData,
        label: string,
        type: string,
        placeholder: string,
        hint?: string
    ) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label}
            </label>
            {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
            <input
                id={id}
                name={id}
                type={type}
                value={form[id]}
                onChange={handleChange}
                placeholder={placeholder}
                min={id === "moveInDate" ? new Date().toISOString().split("T")[0] : undefined}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition
                    focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                    ${errors[id] ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"}`}
            />
            {errors[id] && (
                <p className="mt-1 text-xs text-red-600">{errors[id]}</p>
            )}
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="mx-auto max-w-lg">
                {/* Page title */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Reserve your unit</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Fill in your details and pay the deposit via M-Pesa to secure the unit.
                    </p>
                </div>

                {/* Unit summary */}
                {renderUnitHeader()}

                {/* Form card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">

                    <fieldset className="space-y-5">
                        <legend className="text-xs font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100 w-full">
                            Personal details
                        </legend>
                        {field("fullName", "Full name", "text", "Jane Wanjiku")}
                        {field("phone", "Phone number", "tel", "0712345678", "Your contact number.")}
                        {field("email", "Email address", "email", "jane@example.com")}
                        {field("nationalId", "National ID number", "text", "12345678")}
                    </fieldset>

                    <fieldset className="space-y-5">
                        <legend className="text-xs font-semibold uppercase tracking-widest text-gray-400 pb-1 border-b border-gray-100 w-full">
                            Move-in & payment
                        </legend>
                        {field("moveInDate", "Move-in date", "date", "")}
                        {field(
                            "mpesaPhone",
                            "M-Pesa number",
                            "tel",
                            "0712345678",
                            "The number that will receive the STK Push prompt to pay the deposit."
                        )}
                    </fieldset>

                    {/* Submit error */}
                    {submitError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {submitError}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || unitLoading || !!unitError}
                        className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white
                            hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed
                            transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                    >
                        {submitting ? "Sending STK Push…" : "Pay deposit & reserve unit"}
                    </button>

                    <p className="text-center text-xs text-gray-400">
                        By continuing you agree to our terms. Your deposit is protected and will be refunded if the unit is not available.
                    </p>
                </div>
            </div>
        </main>
    );
}