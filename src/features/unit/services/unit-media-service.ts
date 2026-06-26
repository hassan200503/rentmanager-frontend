import { unitMediaApi } from "../api/unit-media-api";

export const unitMediaService = {
    async list(unitId: string) {
        return unitMediaApi.list(unitId);
    },
    async upload(unitId: string, file: File, primary?: boolean) {
        return unitMediaApi.upload(unitId, file, primary);
    },
    async delete(unitId: string, mediaId: string) {
        return unitMediaApi.delete(unitId, mediaId);
    },
    async setPrimary(unitId: string, mediaId: string) {
        return unitMediaApi.setPrimary(unitId, mediaId);
    },
    async updateCaption(unitId: string, mediaId: string, caption: string) {
        return unitMediaApi.updateCaption(unitId, mediaId, caption);
    },
    async reorder(unitId: string, mediaIds: string[]) {
        return unitMediaApi.reorder(unitId, mediaIds);
    },
};