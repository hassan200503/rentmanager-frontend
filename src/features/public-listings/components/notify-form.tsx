// features/public-listings/components/notify-form.tsx
// Email capture for "notify me when a unit opens". UI-complete; wire the
// submission to a backend endpoint when one exists (see onSubmit below).
"use client";

import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface NotifyFormProps {
    propertyName: string;
    id?: string;
}

export function NotifyForm({ propertyName, id }: NotifyFormProps) {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    if (submitted) {
        return (
            <div className="flex items-center gap-3 rounded-2xl bg-success/10 ring-1 ring-success/20 px-4 py-3.5 animate-scale-in">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-success text-white">
                    <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={2} />
                </span>
                <div className="min-w-0 text-left">
                    <p className="text-sm font-semibold text-ink">You&apos;re on the list</p>
                    <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">
                        We&apos;ll email <span className="font-medium text-ink">{email}</span> the
                        moment a unit at {propertyName} opens up.
                    </p>
                </div>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const value = email.trim();
        if (!EMAIL_RE.test(value)) {
            toast.error("Please enter a valid email address");
            return;
        }
        // TODO: POST to a notify-me endpoint (e.g. /public/notifications) when available.
        setSubmitted(true);
        toast.success("We'll notify you when a unit opens", { description: propertyName });
    };

    return (
        <form
            id={id}
            onSubmit={handleSubmit}
            className="relative z-10 flex w-full flex-col gap-2.5 sm:flex-row"
        >
            <label htmlFor="notify-email" className="sr-only">
                Email address
            </label>
            <input
                id="notify-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                className="form-input flex-1 !py-2.5 text-sm shadow-sm focus:shadow-md focus:shadow-brand/10"
            />
            <button type="submit" className="btn btn-primary !py-2.5 shrink-0">
                <Bell className="w-4 h-4" strokeWidth={2} />
                Get notified
            </button>
        </form>
    );
}