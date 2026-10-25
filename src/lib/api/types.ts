/**
 * SaaS-grade API Response contract
 * Aligns with Spring Boot ApiResponse<T> record
 * Adds tenant awareness + observability metadata
 */
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    errorCode?: string;

    /**
     * Matches Spring Boot long timestamp (ms epoch)
     */
    timestamp: number;

    /**
     * Multi-tenant isolation (optional, provided by backend)
     */
    tenantId?: string;

    /**
     * Observability correlation (traceId from backend logs)
     */
    traceId?: string;
}
