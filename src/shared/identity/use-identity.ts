"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { appConfig } from "@/lib/config/app-config";

export interface Identity {
    userId: string;
    tenantId: string;
    role: "ADMIN" | "USER";
    subscription: "free" | "premium";
    loaded: boolean;
}

/**
 * SaaS-grade identity hook
 * Source of truth: Backend /me endpoint
 * NOT Clerk, NOT localStorage
 */
export function useIdentity(): Identity {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [identity, setIdentity] = useState<Identity>({
        userId: "",
        tenantId: "",
        role: "USER",
        subscription: "free",
        loaded: false,
    });

    useEffect(() => {
        const loadIdentity = async () => {
            if (!isLoaded || !isSignedIn) return;

            try {
                const token = await getToken();

                const res = await fetch(`${appConfig.api.baseUrl}/me`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error("Failed to load identity");

                const data = await res.json();

                setIdentity({
                    userId: data.userId,
                    tenantId: data.tenantId,
                    role: data.role,
                    subscription: data.subscription,
                    loaded: true,
                });
            } catch {
                setIdentity((prev) => ({
                    ...prev,
                    loaded: true,
                }));
            }
        };

        loadIdentity();
    }, [isLoaded, isSignedIn, getToken]);

    return identity;
}