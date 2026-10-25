// features/settings/types/tenant-settings-response.ts
// Mirrors backend TenantSettingsResponse + UpdateTenantSettingsRequest.

export interface TenantSettingsResponse {
    timezone: string;
    currency: string;
    locale: string;
    // REMOVED: emailNotificationsEnabled / smsNotificationsEnabled /
    // pushNotificationsEnabled. The backend never populated them — they
    // serialised as false on every response — and the @Entity that declared
    // them mapped to a table no migration creates. Reminder channels are
    // configured per milestone via /rent-reminders/cadence.
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
