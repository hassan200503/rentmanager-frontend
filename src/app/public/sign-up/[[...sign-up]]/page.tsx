"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark relative overflow-hidden">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-30 dark:opacity-20">
                <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-brand-100 dark:bg-brand-900/20 blur-3xl" />
                <div className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full bg-brand-200 dark:bg-brand-800/10 blur-3xl" />
            </div>

            <div className="w-full max-w-md px-4 relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-brand-50 dark:bg-brand-900/30 mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand dark:text-brand-400">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="font-[var(--font-display-face)] text-2xl font-normal tracking-tight text-fg dark:text-fg-dark">
                        Create your account
                    </h1>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-1">
                        Set up RentManager for your properties
                    </p>
                </div>

                <div className="card-elevated !p-6">
                    <SignUp
                        routing="path"
                        path="/public/sign-up"
                        forceRedirectUrl="/dashboard/properties"
                    />
                </div>

                <p className="text-center text-xs text-fg-subtle dark:text-fg-subtle-dark mt-6">
                    RentManager — Property Management Platform
                </p>
            </div>
        </div>
    );
}
