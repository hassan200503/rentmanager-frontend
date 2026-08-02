// types/announcement-response.ts
// Landlord announcements feature types (mirrors the backend DTOs).

export type AnnouncementChannel = "IN_APP" | "SMS" | "EMAIL" | "WHATSAPP";
export type AnnouncementPriority = "INFO" | "URGENT";
export type AnnouncementDeliveryStatus = "PENDING" | "SENT" | "DELIVERED" | "FAILED" | "SKIPPED_NO_OPTIN";

export interface AnnouncementResponse {
    id: string;
    message: string;
    priority: AnnouncementPriority;
    channels: AnnouncementChannel[];
    expiresAt: string | null;
    createdAt: string;
}

export interface AnnouncementPreviewResponse {
    totalActiveRenters: number;
    inApp: number;
    sms: number;
    email: number;
    whatsapp: number;
    whatsappSkipped: number;
}

export interface ChannelStats {
    channel: AnnouncementChannel;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    skippedNoOptIn: number;
}

export interface AnnouncementHistoryItem {
    id: string;
    message: string;
    priority: AnnouncementPriority;
    channels: AnnouncementChannel[];
    expiresAt: string | null;
    createdAt: string;
    stats: ChannelStats[];
    readCount: number;
    totalRecipients: number;
}

export interface CreateAnnouncementRequest {
    message: string;
    priority: AnnouncementPriority;
    channels: AnnouncementChannel[];
    expiresAt: string | null;
}
