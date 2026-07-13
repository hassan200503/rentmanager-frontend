// app/public/sign-in/page.tsx
"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F4]">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[#14213D]">
                        Sign in
                    </h1>
                    <p className="text-sm text-[#5B6472]">
                        Welcome back — sign in to your account
                    </p>
                </div>

                <SignIn
                    routing="path"
                    path="/public/sign-in"
                    forceRedirectUrl="/dashboard"
                />
            </div>
        </div>
    );
}