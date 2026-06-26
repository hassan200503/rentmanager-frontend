
import {propertyEndpoints} from "@/features/property/api/property-endpoints";

const base = propertyEndpoints.base;

export const propertyMediaEndpoints = {
    list: (propertyId: string) => `${base}/${propertyId}/media`,
    upload: (propertyId: string) => `${base}/${propertyId}/media`,
    delete: (propertyId: string, mediaId: string) =>
        `${base}/${propertyId}/media/${mediaId}`,
    setPrimary: (propertyId: string, mediaId: string) =>
        `${base}/${propertyId}/media/${mediaId}/primary`,
    updateCaption: (propertyId: string, mediaId: string) =>
        `${base}/${propertyId}/media/${mediaId}`,
    reorder: (propertyId: string) => `${base}/${propertyId}/media/reorder`,
};