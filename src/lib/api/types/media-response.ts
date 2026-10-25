export interface MediaUploadResponse {
    id: string;
    tenantId: string;
    resourceId: string;
    url: string;
    type: string;
    caption: string | null;
    primary: boolean;
    sortOrder: number;
}

export interface PropertyMediaResponse {
    id: string;
    propertyId: string;
    fileUrl: string;
    fileName: string;
    mediaType: string;
    primaryMedia: boolean;
    caption: string | null;
    sortOrder: number;
}