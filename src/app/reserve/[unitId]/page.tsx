// app/reserve/[unitId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "@/features/public-listings/api/public-endpoints";

// --- Types ---
interface UnitDetails {
    unitNumber: string;
    label?: string;
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
    label?: string;
    propertyName: string;
    monthlyRent: number;
    depositAmount: number;
}

// Fixed order used to walk to the first invalid field after a failed submit.
const FIELD_ORDER: (keyof FormData)[] = [
    "fullName",
    "phone",
    "email",
    "nationalId",
    "moveInDate",
    "mpesaPhone",
];

const AUTOCOMPLETE: Partial<Record<keyof FormData, string>> = {
    fullName: "name",
    phone: "tel",
    email: "email",
    mpesaPhone: "tel",
};

// --- Helpers ---
const formatKES = (amount: number) =>
    new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(amount);

const validatePhone = (phone: string) => /^(?:\+?254|0)[71]\d{8}$/.test(phone.trim());

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
    const [unitLoading, setUnitLoading] = useState(true);
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

    useEffect(() => {
        if (!unitId) return;

        let cancelled = false;

        apiClient
            .get<UnitSummaryResponse>(publicEndpoints.unitReservationSummary(unitId))
            .then((data) => {
                if (cancelled) return;
                const { unitNumber, label, propertyName, monthlyRent, depositAmount } = data;
                setUnit({ unitNumber, label, propertyName, monthlyRent, depositAmount });
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

        if (Object.keys(errs).length > 0) {
            // Send focus to the first invalid field instead of leaving the
            // person to hunt for it — important on a 6-field form, especially
            // on mobile where an error banner further down may be offscreen.
            const firstInvalid = FIELD_ORDER.find((key) => errs[key]);
            if (firstInvalid) {
                requestAnimationFrame(() => {
                    const el = document.getElementById(firstInvalid);
                    el?.focus();
                    el?.scrollIntoView({ behavior: "smooth", block: "center" });
                });
            }
        }

        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        if (!validate()) return;

        setSubmitting(true);
        setSubmitError(null);
        try {
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

            if (typeof window !== "undefined") {
                sessionStorage.setItem("rm_reservation", JSON.stringify({
                    propertyName: unit?.propertyName ?? "",
                    unitNumber: unit?.unitNumber ?? "",
                    unitLabel: unit?.label ?? "",
                    monthlyRent: unit?.monthlyRent ?? 0,
                    depositAmount: unit?.depositAmount ?? 0,
                    tenantName: form.fullName.trim(),
                    tenantPhone: normalizePhone(form.phone),
                    tenantEmail: form.email.trim(),
                    createdAt: new Date().toISOString(),
                }));
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
                <div className="mb-8 space-y-2">
                    <div className="skeleton h-4 w-1/3" />
                    <div className="skeleton h-6 w-1/2" />
                    <div className="skeleton h-4 w-1/4" />
                </div>
            );
        }
        if (unitError || !unit) {
            return (
                <div className="mb-8 card p-4 text-sm text-danger">
                    {unitError ?? "Unable to load unit details."}
                </div>
            );
        }
        return (
            <div className="mb-8 card p-5">
                <p className="text-xs font-medium uppercase tracking-widest text-ink-muted mb-1">
                    You are reserving
                </p>
                <h2 className="text-xl font-semibold text-ink mb-1">
                    {unit.label || `Unit ${unit.unitNumber}`}
                </h2>
                <p className="text-sm text-ink-muted mb-4">
                    {unit.label ? unit.unitNumber + " \u00B7 " : ""}{unit.propertyName}
                </p>

                {/* The deposit is the amount actually charged right now via STK
                    Push, so it leads — the monthly rent below is reference info,
                    not what's being paid today. Uses only established tokens
                    (primary-light/primary-dark); brass intentionally not used
                    per earlier note, not yet a confirmed token for this. */}
                <div className="rounded-xl bg-brand-50 dark:bg-brand-800 px-4 py-3 mb-3">
                    <p className="text-xs font-medium text-brand-700 dark:text-brand-300 uppercase tracking-wide mb-1">
                        Deposit due now
                    </p>
                    <p className="font-data text-2xl font-semibold text-brand-700 dark:text-brand-300">
                        {formatKES(unit.depositAmount)}
                    </p>
                </div>

                <p className="text-sm text-ink-muted">
                    <span className="font-medium text-ink">Monthly rent:</span>{" "}
                    <span className="font-data">{formatKES(unit.monthlyRent)}</span>
                </p>
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
            <label htmlFor={id} className="block text-sm font-medium text-ink mb-1">
                {label}
            </label>
            {hint && <p className="text-xs text-ink-muted mb-1">{hint}</p>}
            <input
                id={id}
                name={id}
                type={type}
                value={form[id]}
                onChange={handleChange}
                placeholder={placeholder}
                min={id === "moveInDate" ? new Date().toISOString().split("T")[0] : undefined}
                autoComplete={AUTOCOMPLETE[id] ?? "off"}
                inputMode={id === "nationalId" ? "numeric" : undefined}
                aria-invalid={!!errors[id]}
                aria-describedby={errors[id] ? `${id}-error` : undefined}
                className={`form-input w-full text-sm ${errors[id] ? "border-danger" : ""}`}
            />
            {errors[id] && (
                <p id={`${id}-error`} className="mt-1 text-xs text-danger">
                    {errors[id]}
                </p>
            )}
        </div>
    );

    return (
        <main className="min-h-screen bg-canvas py-12 px-4">
            <div className="mx-auto max-w-lg">
                <div className="mb-6">
                    <h1 className="font-display text-2xl font-bold text-ink">Reserve your unit</h1>
                    <p className="mt-1 text-sm text-ink-muted">
                        Fill in your details and pay the deposit via M-Pesa to secure the unit.
                    </p>
                </div>

                {renderUnitHeader()}

                <form onSubmit={handleSubmit} noValidate className="card p-6 space-y-5">
                    <fieldset disabled={submitting} className="space-y-5">
                        <legend className="text-xs font-semibold uppercase tracking-widest text-ink-muted pb-1 border-b border-ink/[0.08] w-full">
                            Personal details
                        </legend>
                        {field("fullName", "Full name", "text", "Jane Wanjiku")}
                        {field("phone", "Phone number", "tel", "0712345678", "Your contact number.")}
                        {field("email", "Email address", "email", "jane@example.com")}
                        {field("nationalId", "National ID number", "text", "12345678")}
                    </fieldset>

                    <fieldset disabled={submitting} className="space-y-5">
                        <legend className="text-xs font-semibold uppercase tracking-widest text-ink-muted pb-1 border-b border-ink/[0.08] w-full">
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

                    {submitError && (
                        <div className="card p-3 text-sm text-danger" role="alert">
                            {submitError}
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                        <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
                        <span>Payments are processed securely via M-Pesa STK Push.</span>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || unitLoading || !!unitError}
                        className="btn-primary w-full py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "Sending STK Push…" : "Pay deposit & reserve unit"}
                    </button>

                    <p className="text-center text-xs text-ink-muted">
                        By continuing you agree to our terms. Your deposit is protected and will be refunded if the unit is not available.
                    </p>
                </form>
            </div>
        </main>
    );
}