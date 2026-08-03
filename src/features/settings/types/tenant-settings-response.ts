// features/settings/types/tenant-settings-response.ts
// Mirrors backend TenantSettingsResponse + UpdateTenantSettingsRequest.

export interface TenantSettingsResponse {
    timezone: string;
    currency: string;
    locale: string;
    emailNotificationsEnabled: boolean;
    smsNotificationsEnabled: boolean;
    pushNotificationsEnabled: boolean;
    maintenanceModuleEnabled: boolean;
    accountingModuleEnabled: boolean;
    analyticsModuleEnabled: boolean;
    automationModuleEnabled: boolean;
    primaryColor: string | null;
    secondaryColor: string | null;
    logoUrl: string | null;
    faviconUrl: string | null;
    emergencyContactPhone: string | null;
    emergencyContact24h: boolean;
    kraPin: string | null;
    vatRegistered: boolean;
}

export interface UpdateTenantSettingsRequest {
    timezone?: string;
    currency?: string;
    locale?: string;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    logoUrl?: string | null;
    faviconUrl?: string | null;
    emergencyContactPhone?: string | null;
    emergencyContact24h?: boolean;
    kraPin?: string | null;
    vatRegistered?: boolean;
}
