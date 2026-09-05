// app/reserve/[unitId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { publicEndpoints } from "@/features/public-listings/api/public-endpoints";
import { getProcessErrorMessage } from "@/shared/utils/error-handler";
import { formatCurrency, type MoneyValue } from "@/shared/utils/money";

// --- Types ---
interface UnitDetails {
    unitNumber: string;
    label?: string;
    propertyName: string;
    monthlyRent: string; // BigDecimal -> JSON string
    depositAmount: string;
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
    monthlyRent: string; // BigDecimal -> JSON string
    depositAmount: string;
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
const formatKES = (amount: MoneyValue) => formatCurrency(amount);

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
            setSubmitError(getProcessErrorMessage(err, "Unexpected error."));
            setSubmitting(false);
        }
    };

    // --- Render: unit header states ---
    const renderUnitHeader = () => {
        if (unitLoading) {
            return (
                <div className="mb-10 rounded-3xl border-2 border-border/40 dark:border-border-dark/40 bg-gradient-to-br from-white via-white to-brand-50/20 dark:from-surface-dark dark:to-brand-900/10 p-8 space-y-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] animate-fade-in-up"
                    style={{ animationDelay: '100ms' }}
                >
                    <div className="skeleton h-4 w-1/3 rounded-lg" />
                    <div className="skeleton h-7 w-2/3 rounded-lg" />
                    <div className="skeleton h-5 w-1/2 rounded-lg" />
                    <div className="skeleton h-24 w-full rounded-2xl mt-4" />
                </div>
            );
        }
        if (unitError || !unit) {
            return (
                <div className="mb-10 rounded-3xl border-2 border-danger/40 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 p-6 shadow-[0_4px_16px_rgba(220,38,38,0.15)] animate-fade-in-up"
                    style={{ animationDelay: '100ms' }}
                >
                    <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-danger/10 dark:bg-danger/20 flex-shrink-0">
                            <span className="text-danger text-xl">⚠</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-danger mb-1">Unable to load unit</p>
                            <p className="text-sm text-danger/80">
                                {unitError ?? "Unable to load unit details."}
                            </p>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="mb-10 relative animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                {/* Premium outer glow */}
                <div className="absolute -inset-[1px] rounded-[1.6rem] bg-gradient-to-br from-brand-200/30 via-emerald-100/20 to-transparent dark:from-brand-600/20 dark:to-transparent opacity-60 blur-xl -z-10" aria-hidden="true" />
                
                <div className="relative rounded-3xl border-2 border-brand-200/50 dark:border-brand-700/50 bg-gradient-to-br from-white via-brand-50/30 to-white dark:from-surface-dark dark:via-brand-900/10 dark:to-surface-dark shadow-[0_8px_32px_-4px_rgba(5,150,105,0.15),0_2px_8px_-2px_rgba(0,0,0,0.05),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_-4px_rgba(5,150,105,0.25)] overflow-hidden">
                    {/* Decorative gradient overlay */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-brand-400/8 via-emerald-400/5 to-transparent rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
                    
                    <div className="relative z-10 p-8">
                        {/* Header label */}
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-[0_4px_12px_-2px_rgba(5,150,105,0.4)]">
                                <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.5} />
                            </div>
                            <p className="text-[11px] font-black uppercase tracking-[0.12em] text-brand-700 dark:text-brand-300">
                                You are reserving
                            </p>
                        </div>
                        
                        {/* Unit title */}
                        <h2 className="text-2xl md:text-3xl font-display font-black text-ink dark:text-white mb-2 leading-tight tracking-tight">
                            {unit.label || `Unit ${unit.unitNumber}`}
                        </h2>
                        
                        {/* Property meta */}
                        <p className="text-sm font-bold text-ink-muted dark:text-white/70 mb-6 flex items-center gap-2">
                            {unit.label && (
                                <>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ink/[0.06] dark:bg-white/[0.08] border border-ink/[0.08] dark:border-white/[0.08] text-xs font-black uppercase tracking-wider">
                                        {unit.unitNumber}
                                    </span>
                                    <span className="text-ink-muted/40">·</span>
                                </>
                            )}
                            <span>{unit.propertyName}</span>
                        </p>

                        {/* Deposit card - ultra premium */}
                        <div className="relative mb-5">
                            {/* Card glow */}
                            <div className="absolute -inset-1 bg-gradient-to-br from-brand-400/30 to-emerald-400/20 rounded-2xl blur-xl opacity-60" aria-hidden="true" />
                            
                            <div className="relative rounded-2xl bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 dark:from-brand-600 dark:via-brand-700 dark:to-brand-800 p-6 shadow-[0_12px_32px_-8px_rgba(5,150,105,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] dark:shadow-[0_12px_32px_-8px_rgba(5,150,105,0.6)] border border-brand-400/50 dark:border-brand-500/50">
                                {/* Inner gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 rounded-2xl pointer-events-none" aria-hidden="true" />
                                
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm">
                                            <span className="text-white text-xs">💳</span>
                                        </div>
                                        <p className="text-[10px] font-black text-white/90 uppercase tracking-[0.15em]">
                                            Deposit Due Now
                                        </p>
                                    </div>
                                    <p className="font-data text-4xl md:text-5xl font-black text-white mb-1 tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
                                        {formatKES(unit.depositAmount)}
                                    </p>
                                    <p className="text-sm font-bold text-white/80">
                                        Paid securely via M-Pesa
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Monthly rent reference */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-ink/[0.03] dark:bg-white/[0.04] border border-ink/[0.06] dark:border-white/[0.06]">
                            <span className="text-sm font-bold text-ink-muted dark:text-white/70">
                                Monthly Rent:
                            </span>
                            <span className="font-data text-lg font-black text-ink dark:text-white tabular-nums">
                                {formatKES(unit.monthlyRent)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Field helper with premium styling ---
    const field = (
        id: keyof FormData,
        label: string,
        type: string,
        placeholder: string,
        hint?: string
    ) => (
        <div>
            <label htmlFor={id} className="block text-sm font-bold text-ink dark:text-white mb-2">
                {label}
            </label>
            {hint && (
                <p className="text-xs font-medium text-ink-muted dark:text-white/60 mb-2 leading-relaxed">
                    {hint}
                </p>
            )}
            <div className="relative group">
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
                    className={`w-full h-12 px-4 text-base font-medium bg-white dark:bg-white/[0.06] border-2 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 placeholder:text-ink-muted/40 dark:placeholder:text-white/30 focus:outline-none focus:ring-0 ${
                        errors[id]
                            ? "border-danger focus:border-danger focus:shadow-[0_4px_20px_-4px_rgba(220,38,38,0.3),0_0_0_4px_rgba(220,38,38,0.08)]"
                            : "border-border/60 dark:border-white/[0.12] hover:border-border dark:hover:border-white/[0.18] focus:border-brand-400 dark:focus:border-brand-500 focus:shadow-[0_4px_20px_-4px_rgba(5,150,105,0.25),0_0_0_4px_rgba(5,150,105,0.08)]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                />
                {/* Focus indicator ring */}
                {!errors[id] && (
                    <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-transparent group-focus-within:ring-brand-200/40 dark:group-focus-within:ring-brand-600/30 pointer-events-none transition-all duration-300" aria-hidden="true" />
                )}
            </div>
            {errors[id] && (
                <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-lg bg-danger/5 dark:bg-danger/10 border border-danger/20 dark:border-danger/30">
                    <span className="text-danger text-sm flex-shrink-0 mt-0.5">⚠</span>
                    <p id={`${id}-error`} className="text-sm font-medium text-danger leading-relaxed">
                        {errors[id]}
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <main className="min-h-screen bg-gradient-to-b from-canvas via-canvas to-brand-50/10 dark:to-brand-900/5 py-16 px-4 sm:px-6">
            <div className="mx-auto max-w-2xl">
                {/* ═══════════ PREMIUM HERO HEADER ═══════════ */}
                <div className="mb-12 text-center animate-fade-in-up">
                    {/* Premium badge */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-br from-emerald-100 via-brand-50 to-brand-100 dark:from-emerald-900/40 dark:to-brand-900/30 border-2 border-emerald-200/60 dark:border-emerald-700/60 shadow-[0_2px_12px_rgba(16,185,129,0.15)] mb-6 backdrop-blur-sm">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                        <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 uppercase tracking-widest">
                            Secure Reservation
                        </span>
                    </div>
                    
                    <h1 className="font-display text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-ink via-ink to-ink/70 dark:from-white dark:via-white dark:to-white/80 leading-[1.1] tracking-[-0.02em] mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                        Reserve Your Unit
                    </h1>
                    <p className="text-base text-ink-muted dark:text-white/70 max-w-xl mx-auto leading-relaxed font-medium">
                        Fill in your details and pay the deposit via M-Pesa to secure the unit. Your reservation is protected.
                    </p>
                </div>

                {renderUnitHeader()}

                <form onSubmit={handleSubmit} noValidate className="relative animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    {/* Premium form card with outer glow */}
                    <div className="absolute -inset-[1px] rounded-[1.6rem] bg-gradient-to-br from-border/20 via-transparent to-transparent opacity-40 blur-xl -z-10" aria-hidden="true" />
                    
                    <div className="relative rounded-3xl border-2 border-border/40 dark:border-border-dark/40 bg-gradient-to-br from-white via-white/98 to-brand-50/10 dark:from-surface-dark dark:via-[#1a1d24] dark:to-brand-900/5 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.8)] dark:shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3)] p-8 md:p-10 space-y-8">
                        {/* Personal Details Section */}
                        <fieldset disabled={submitting} className="space-y-6">
                            <legend className="flex items-center gap-3 mb-6">
                                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm">
                                    <span className="text-white text-sm">👤</span>
                                </div>
                                <span className="text-sm font-black uppercase tracking-[0.12em] text-ink dark:text-white">
                                    Personal Details
                                </span>
                            </legend>
                            <div className="grid gap-6 md:grid-cols-2">
                                {field("fullName", "Full Name", "text", "Jane Wanjiku")}
                                {field("phone", "Phone Number", "tel", "0712345678", "Your contact number.")}
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                                {field("email", "Email Address", "email", "jane@example.com")}
                                {field("nationalId", "National ID Number", "text", "12345678")}
                            </div>
                        </fieldset>

                        {/* Divider */}
                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t-2 border-gradient-to-r from-transparent via-border/40 to-transparent dark:via-border-dark/40" />
                            </div>
                        </div>

                        {/* Move-in & Payment Section */}
                        <fieldset disabled={submitting} className="space-y-6">
                            <legend className="flex items-center gap-3 mb-6">
                                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-sm">
                                    <span className="text-white text-sm">📅</span>
                                </div>
                                <span className="text-sm font-black uppercase tracking-[0.12em] text-ink dark:text-white">
                                    Move-in & Payment
                                </span>
                            </legend>
                            <div className="grid gap-6 md:grid-cols-2">
                                {field("moveInDate", "Move-in Date", "date", "")}
                                {field(
                                    "mpesaPhone",
                                    "M-Pesa Number",
                                    "tel",
                                    "0712345678",
                                    "The number that will receive the STK Push prompt to pay the deposit."
                                )}
                            </div>
                        </fieldset>

                        {/* Error Alert */}
                        {submitError && (
                            <div className="rounded-2xl border-2 border-danger/40 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 p-5 shadow-[0_4px_16px_rgba(220,38,38,0.15)] animate-fade-in-up" role="alert">
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-danger/10 dark:bg-danger/20 flex-shrink-0">
                                        <span className="text-danger text-xl">⚠</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-danger mb-1">Payment Error</p>
                                        <p className="text-sm text-danger/80">{submitError}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t-2 border-gradient-to-r from-transparent via-border/40 to-transparent dark:via-border-dark/40" />
                            </div>
                        </div>

                        {/* Security Badge */}
                        <div className="flex items-start gap-3 px-4 py-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/40 dark:border-emerald-800/40">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.4)] flex-shrink-0">
                                <ShieldCheck className="w-5 h-5 text-white" strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                                    Secure Payment Processing
                                </p>
                                <p className="text-xs font-medium text-emerald-700/80 dark:text-emerald-400/80 leading-relaxed">
                                    Payments are processed securely via M-Pesa STK Push. Your financial information is protected with bank-level encryption.
                                </p>
                            </div>
                        </div>

                        {/* Ultra-Premium Submit Button */}
                        <div className="space-y-4">
                            <div className="relative group">
                                {/* Button glow effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 rounded-2xl opacity-0 group-hover:opacity-70 blur-xl transition-all duration-500 group-disabled:opacity-0" aria-hidden="true" />
                                
                                <button
                                    type="submit"
                                    disabled={submitting || unitLoading || !!unitError}
                                    className="relative w-full h-14 rounded-[14px] bg-gradient-to-b from-brand-500 via-brand-600 to-brand-700 hover:from-brand-600 hover:via-brand-700 hover:to-brand-800 disabled:from-ink-muted disabled:via-ink-muted disabled:to-ink-muted text-white font-black text-base uppercase tracking-wider shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_24px_-6px_rgba(5,150,105,0.6),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.25),0_16px_32px_-8px_rgba(5,150,105,0.7),0_0_0_4px_rgba(5,150,105,0.1)] active:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_-4px_rgba(5,150,105,0.4)] disabled:shadow-none transition-all duration-300 hover:-translate-y-1 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50 overflow-hidden"
                                >
                                    {/* Button shine effect */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" aria-hidden="true" />
                                    
                                    <span className="relative z-10 flex items-center justify-center gap-3">
                                        {submitting ? (
                                            <>
                                                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                                <span>Sending STK Push...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>💳</span>
                                                <span>Pay Deposit & Reserve Unit</span>
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>

                            {/* Terms & Protection Notice */}
                            <div className="text-center space-y-2 px-4">
                                <p className="text-xs font-medium text-ink-muted dark:text-white/60 leading-relaxed">
                                    By continuing you agree to our <span className="font-bold text-brand hover:text-brand-700 dark:hover:text-brand-400 transition-colors cursor-pointer">terms of service</span>.
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-50/50 dark:bg-brand-900/20 border border-brand-200/40 dark:border-brand-800/40">
                                    <ShieldCheck className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" strokeWidth={2.5} />
                                    <p className="text-[11px] font-bold text-brand-700 dark:text-brand-400">
                                        Your deposit is protected and will be refunded if the unit is not available
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </main>
    );
}