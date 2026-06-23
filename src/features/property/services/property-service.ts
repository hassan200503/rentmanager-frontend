import { propertyApi } from "../api/property-api";
import {
    CreatePropertyRequest,
    PropertyListParams,
    UpdatePropertyRequest,
} from "../types/property-request";

export const propertyService = {
    async list(params?: PropertyListParams) {
        return propertyApi.list(params);
    },

    async get(id: string) {
        return propertyApi.get(id);
    },

    async create(payload: CreatePropertyRequest) {
        return propertyApi.create(payload);
    },

    async update(id: string, payload: UpdatePropertyRequest) {
        return propertyApi.update(id, payload);
    },

    async archive(id: string) {
        return propertyApi.archive(id);
    },

    async activate(id: string) {
        return propertyApi.activate(id);
    },
};
