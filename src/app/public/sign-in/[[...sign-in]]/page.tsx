"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <SignIn
                routing="path"
                path="/public/sign-in"
                forceRedirectUrl="/dashboard/properties"
            />
        </div>
    );
}