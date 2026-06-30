"use client";

import { useSearchParams } from "next/navigation";

export default function ReservationConfirmedPage() {
    const searchParams = useSearchParams();
    const reservationId = searchParams.get("reservationId");

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 flex items-center">
            <div className="mx-auto max-w-md w-full">
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                        <span className="text-3xl text-emerald-600">✓</span>
                    </div>

                    <h1 className="text-xl font-bold text-gray-900">Deposit received</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Your M-Pesa payment was successful and your unit is now reserved.
                    </p>

                    <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-left">
                        <p className="text-sm font-medium text-emerald-900">Check your phone</p>
                        <p className="mt-1 text-sm text-emerald-800">
                            We&apos;ve sent you an SMS with your login details. Use them to sign in
                            and start tracking your rent, payments, and lease — right from your
                            phone.
                        </p>
                    </div>

                    {reservationId && (
                        <p className="mt-6 text-xs text-gray-400">
                            Reservation reference: {reservationId}
                        </p>
                    )}

                    <p className="mt-4 text-xs text-gray-400">
                        Didn&apos;t get an SMS? It can take a minute to arrive. If it still
                        doesn&apos;t show up, contact your landlord for help.
                    </p>
                </div>
            </div>
        </main>
    );
}