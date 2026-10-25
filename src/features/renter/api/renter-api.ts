import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import { renterEndpoints } from "./renter-endpoints";
import type { AddRenterRequest, Renter } from "../types/renter";

interface RenterPage {
    content: Renter[];
    totalElements: number;
    number: number;
    size: number;
}

export const renterApi = {
    add: async (payload: AddRenterRequest): Promise<Renter> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<Renter>(renterEndpoints.base, payload, token, tenantId);
    },

    list: async (page = 0, size = 100): Promise<RenterPage> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<RenterPage>(renterEndpoints.list(page, size), token, tenantId);
    },

    search: async (query: string): Promise<Renter[]> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<Renter[]>(renterEndpoints.search(query), token, tenantId);
    },
};

export type { RenterPage };
