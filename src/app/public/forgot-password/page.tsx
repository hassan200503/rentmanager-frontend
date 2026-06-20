"use client";

import { SignIn } from "@clerk/nextjs";

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black">

            <div className="w-full max-w-md">

                <div className="text-center mb-6">
                    <h1 className="text-2xl font-semibold text-white">
                        Reset password
                    </h1>
                    <p className="text-sm text-gray-400">
                        We’ll help you recover your account
                    </p>
                </div>

                <SignIn
                    routing="path"
                    path="/public/forgot-password"
                    fallbackRedirectUrl="/public/sign-in"
                />

            </div>

        </div>
    );
}