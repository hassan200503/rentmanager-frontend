import { unitApi } from "../api/unit-api";
import {
    CreateUnitRequest,
    UnitListParams,
    UpdateUnitRequest,
} from "../types/unit-request";

export const unitService = {
    async list(params: UnitListParams) {
        return unitApi.list(params);
    },

    async get(id: string) {
        return unitApi.get(id);
    },

    async create(payload: CreateUnitRequest) {
        return unitApi.create(payload);
    },

    async update(id: string, payload: UpdateUnitRequest) {
        return unitApi.update(id, payload);
    },

    async uploadImage(id: string, file: File) {
        return unitApi.uploadImage(id, file);
    },
};