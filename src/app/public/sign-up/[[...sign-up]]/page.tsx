"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SignUp } from "@clerk/nextjs";
import { type SignupIntent } from "@/lib/auth/clerk-metadata";
import { BadgeMark } from "@/shared/components/brand/BrandBadge";

/**
 * Sign-up page with persona intent capture.
 *
 * CTA flow: landing page "List property" / "Get started" links carry
 * `?intent=landlord` (see lib/auth/signup-links.ts). The intent is stored
 * in Clerk unsafeMetadata (`signupIntent`), then the user.created webhook
 * seeds publicMetadata.userType:
 *   - intent=landlord → landlord_pending (must complete onboarding)
 *   - no intent       → renter (default; portal)
 *
 * unsafeMetadata is client-writable by design and NEVER used for
 * authorization — it only picks the initial persona, which the backend
 * re-classifies from database truth at the first real transition.
 */

function SignUpForm() {
    const searchParams = useSearchParams();
    const rawIntent = searchParams.get("intent");
    const intent: SignupIntent | undefined =
        rawIntent === "landlord" || rawIntent === "renter" ? rawIntent : undefined;

    return (
        <div className="card-elevated !p-6">
            <SignUp
                routing="path"
                path="/public/sign-up"
                // /continue routes from what the API says the new account is:
                // a landlord goes on to set up their organisation, a renter to
                // the portal. Sending everyone to /onboarding put renters in
                // front of a "create your organisation" form.
                forceRedirectUrl="/continue"
                unsafeMetadata={{
                    signupIntent: intent,
                }}
            />
        </div>
    );
}

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
                    <div className="inline-flex items-center justify-center mb-4">
                        <BadgeMark size={48} />
                    </div>
                    <h1 className="font-[var(--font-display-face)] text-2xl font-normal tracking-tight text-fg dark:text-fg-dark">
                        Create your account
                    </h1>
                    <p className="text-sm text-fg-muted dark:text-fg-muted-dark mt-1">
                        Set up RentManager for your properties
                    </p>
                </div>

                <Suspense fallback={<div className="card-elevated !p-6 min-h-40" aria-busy="true" />}>
                    <SignUpForm />
                </Suspense>

                <p className="text-center text-xs text-fg-subtle dark:text-fg-subtle-dark mt-6">
                    RentManager — Property Management Platform
                </p>
            </div>
        </div>
    );
}