"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

/**
 * SaaS-grade Query Provider
 * Handles caching, retries, and resilience for API calls
 */
export default function QueryProvider({ children }: { children: ReactNode }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        retry: 1, // retry once for resilience
                        refetchOnWindowFocus: false,
                        staleTime: 1000 * 30, // 30s cache window
                    },
                    mutations: {
                        retry: 0, // avoid duplicate writes
                    },
                },
            })
    );

    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
