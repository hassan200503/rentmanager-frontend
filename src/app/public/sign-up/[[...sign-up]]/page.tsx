// app/public/sign-up/page.tsx
"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F7F7F4]">
            <div className="w-full max-w-md">
                <div className="text-center mb-6">
                    <h1 className="font-[var(--font-display)] text-2xl font-semibold text-[#14213D]">
                        Create your account
                    </h1>
                    <p className="text-sm text-[#5B6472]">
                        Set up RentManager for your properties
                    </p>
                </div>

                <SignUp
                    routing="path"
                    path="/public/sign-up"
                    forceRedirectUrl="/dashboard/properties"
                />
            </div>
        </div>
    );
}