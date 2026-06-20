"use client";

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <SignUp
                routing="path"
                path="/public/sign-up"
                forceRedirectUrl="/dashboard/properties"
            />
        </div>
    );
}