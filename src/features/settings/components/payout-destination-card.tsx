// features/settings/components/payout-destination-card.tsx
//
// Where the landlord's rent is paid out to.
//
// This screen did not exist, and neither did the endpoint behind it, while
// three backend paths hard-required the value: the automatic payout after
// each rent payment, the manual disbursement endpoint, and the retry sweep.
// The automatic one refused with a log line and returned — so rent could be
// collected, credited, and never paid out, with the landlord unable to fix it
// because there was nothing to fix it with.
//
// The unset state is therefore treated as a problem to solve, not a blank
// field: it is shown as a warning with the consequence spelled out.
"use client";

import { useEffect, useState } from "react";
import { Banknote, Check, Info, Loader2, ShieldCheck } from "lucide-react";
import {
    usePayoutDestinationQuery,
    useUpdatePayoutDestinationMutation,
} from "../hooks/use-payout-destination";

/** Mirrors the server-side @Pattern so the error arrives before the request does. */
const KENYAN_MSISDN = /^\+2547\d{8}$/;

export function PayoutDestinationCard() {
    const { data, isLoading, isError } = usePayoutDestinationQuery();
    const mutation = useUpdatePayoutDestinationMutation();

    const [value, setValue] = useState("");
    const [touched, setTouched] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        // Deliberately not prefilled from the API: it only ever returns a
        // masked number, and putting "*******5678" in an editable field would
        // either be submitted verbatim or have to be silently ignored.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue("");
        setTouched(false);
    }, [data?.maskedPhoneNumber]);

    const trimmed = value.trim();
    const isValid = KENYAN_MSISDN.test(trimmed);
    const showError = touched && trimmed.length > 0 && !isValid;

    const save = () => {
        if (!isValid) {
            setTouched(true);
            return;
        }
        setSaved(false);
        mutation.mutate({ payoutPhoneNumber: trimmed }, { onSuccess: () => setSaved(true) });
    };

    return (
        <div className="card animate-fade-in-up">
            <h2 className="section-header inline-flex items-center gap-2">
                <Banknote className="h-4 w-4 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                Payout number
            </h2>

            <p className="text-sm text-fg-muted dark:text-fg-muted-dark mb-4">
                Only needed if RentManager is collecting rent on your behalf. On direct
                collection &mdash; the default &mdash; rent settles into your own M-Pesa the
                moment a renter pays, so there is nothing to pay out. When a payout number
                is used, money can only go here: nobody, including your managers, can
                redirect it.
            </p>

            {isLoading && (
                <div className="h-20 rounded-lg bg-border-subtle/60 dark:bg-border-subtle-dark/40 animate-pulse" aria-busy="true" />
            )}

            {isError && (
                <p className="text-sm text-danger py-4">
                    Could not load your payout number. Refresh the page to try again.
                </p>
            )}

            {data && !isLoading && !isError && (
                <>
                    {data.configured ? (
                        <div className="flex items-center gap-2.5 rounded-xl border border-border dark:border-border-dark bg-border-subtle/40 dark:bg-border-subtle-dark/30 px-3.5 py-3 mb-4">
                            <ShieldCheck className="h-4 w-4 shrink-0 text-success" strokeWidth={2} />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                    Paying out to {data.maskedPhoneNumber}
                                </p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                    Enter a new number below to change it.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2.5 rounded-xl border border-border dark:border-border-dark bg-border-subtle/50 dark:bg-border-subtle-dark/30 px-3.5 py-3 mb-4">
                            <Info className="h-4 w-4 mt-0.5 shrink-0 text-fg-muted dark:text-fg-muted-dark" strokeWidth={2} />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-fg dark:text-fg-dark">
                                    No payout number set
                                </p>
                                <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                                    This is expected on direct collection: rent goes straight to
                                    your own M-Pesa, so there is nothing for us to pay out. Add a
                                    number only if RentManager collects on your behalf.
                                </p>
                            </div>
                        </div>
                    )}

                    <label
                        htmlFor="payout-number"
                        className="block text-xs font-medium text-fg dark:text-fg-dark mb-1.5"
                    >
                        {data.configured ? "New payout number" : "Payout number"}
                    </label>
                    <input
                        id="payout-number"
                        type="tel"
                        inputMode="tel"
                        autoComplete="off"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onBlur={() => setTouched(true)}
                        placeholder="+254712345678"
                        aria-invalid={showError}
                        aria-describedby="payout-number-hint"
                        className="form-input w-full max-w-xs"
                    />
                    <p
                        id="payout-number-hint"
                        className={`mt-1.5 text-xs ${showError ? "text-danger" : "text-fg-muted dark:text-fg-muted-dark"}`}
                    >
                        {showError
                            ? "Enter a Safaricom number in the form +254712345678."
                            : "Safaricom numbers only, including the +254 country code."}
                    </p>

                    <div className="mt-4 pt-4 border-t border-border dark:border-border-dark flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-fg-muted dark:text-fg-muted-dark">
                            Changes are recorded, including who made them.
                        </p>

                        <div className="flex items-center gap-3">
                            {saved && (
                                <span className="inline-flex items-center gap-1.5 text-xs text-success">
                                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                                    Saved
                                </span>
                            )}
                            {mutation.isError && (
                                <span className="text-xs text-danger">Could not save. Try again.</span>
                            )}
                            <button
                                type="button"
                                onClick={save}
                                disabled={!isValid || mutation.isPending}
                                className="btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {mutation.isPending && (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />
                                )}
                                {data.configured ? "Update number" : "Save number"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
