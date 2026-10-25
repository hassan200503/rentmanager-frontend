import { propertyMediaApi } from "../api/property-media-api";

export const propertyMediaService = {
    async list(propertyId: string) {
        return propertyMediaApi.list(propertyId);
    },
    async upload(propertyId: string, file: File, primary?: boolean) {
        return propertyMediaApi.upload(propertyId, file, primary);
    },
    async delete(propertyId: string, mediaId: string) {
        return propertyMediaApi.delete(propertyId, mediaId);
    },
    async setPrimary(propertyId: string, mediaId: string) {
        return propertyMediaApi.setPrimary(propertyId, mediaId);
    },
    async updateCaption(propertyId: string, mediaId: string, caption: string) {
        return propertyMediaApi.updateCaption(propertyId, mediaId, caption);
    },
    async reorder(
        propertyId: string,
        items: { mediaId: string; sortOrder: number }[]
    ) {
        return propertyMediaApi.reorder(propertyId, items);
    },
};