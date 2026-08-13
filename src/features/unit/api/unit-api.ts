import { unitEndpoints } from "./unit-endpoints";
import {
    CreateUnitRequest,
    UnitListParams,
    UnitPageResponse,
    UnitResponse,
    UpdateUnitRequest,
} from "../types/unit-request";
import { apiClient } from "@/lib/api/client";
import { getAuthContext } from "@/lib/auth/get-auth-context";
import {UnitSummaryResponse} from "@/features/unit/types/unit-summary";

const buildPageQuery = (params?: UnitListParams) => {
    const query = new URLSearchParams();
    query.set("page", String(params?.page ?? 0));
    query.set("size", String(params?.size ?? 10));
    return query.toString();
};

const toPage = (
    content: UnitResponse[],
    params?: UnitListParams
): UnitPageResponse => {
    const page = params?.page ?? 0;
    const size = params?.size ?? content.length;

    return {
        content,
        totalElements: content.length,
        totalPages: content.length === 0 ? 0 : 1,
        number: page,
        size,
        first: page === 0,
        last: true,
        empty: content.length === 0,
    };
};

export const unitApi = {




    list: async (params: UnitListParams): Promise<UnitPageResponse> => {
        const { token, tenantId } = await getAuthContext();

        // NOTE (frontend-only fix, no backend business logic changed):
        // GET /units/status/{status} is tenant-scoped only on the backend —
        // it has no propertyId parameter. Calling it directly while viewing
        // a single property's unit table would leak units from every other
        // property the landlord owns into this table. When both propertyId
        // and status are present, we fetch the property-scoped page instead
        // and filter by status client-side. Trade-off: totalElements reflects
        // the filtered subset of the fetched page, not a true global count
        // for that status — acceptable given typical per-property unit counts.
        if (params.status && !params.propertyId) {
            const result = await apiClient.get<UnitResponse[] | UnitPageResponse>(
                unitEndpoints.byStatus(params.status),
                token,
                tenantId
            );
            if (Array.isArray(result)) {
                return toPage(result, params);
            }
            return result;
        }

        if (params.status && params.propertyId) {
            const query = buildPageQuery({ ...params, size: params.size ?? 100 });
            const endpoint = params.search
                ? `${unitEndpoints.search}?keyword=${encodeURIComponent(params.search)}&${query}`
                : `${unitEndpoints.byProperty(params.propertyId)}?${query}`;

            const page = await apiClient.get<UnitPageResponse>(endpoint, token, tenantId);
            const filtered = page.content.filter((u) => u.status === params.status);

            return {
                ...page,
                content: filtered,
                totalElements: filtered.length,
                empty: filtered.length === 0,
            };
        }

        const query = buildPageQuery(params);

        const endpoint = params.search
            ? `${unitEndpoints.search}?keyword=${encodeURIComponent(params.search)}&${query}`
            : `${unitEndpoints.byProperty(params.propertyId)}?${query}`;

        return apiClient.get<UnitPageResponse>(endpoint, token, tenantId);
    },





    get: async (id: string): Promise<UnitResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<UnitResponse>(
            unitEndpoints.byId(id),
            token,
            tenantId
        );
    },

    create: async (payload: CreateUnitRequest): Promise<UnitResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.post<UnitResponse>(
            unitEndpoints.base,
            payload,
            token,
            tenantId
        );
    },

    update: async (
        id: string,
        payload: UpdateUnitRequest
    ): Promise<UnitResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.put<UnitResponse>(
            unitEndpoints.byId(id),
            payload,
            token,
            tenantId
        );
    },

    activate: async (id: string): Promise<string> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.patch<string>(
            unitEndpoints.activate(id),
            undefined,
            token,
            tenantId
        );
    },

    archive: async (id: string): Promise<string> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.patch<string>(
            unitEndpoints.archive(id),
            undefined,
            token,
            tenantId
        );
    },

    markOccupied: async (id: string): Promise<string> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.patch<string>(
            unitEndpoints.markOccupied(id),
            undefined,
            token,
            tenantId
        );
    },

    markVacant: async (id: string): Promise<string> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.patch<string>(
            unitEndpoints.markVacant(id),
            undefined,
            token,
            tenantId
        );
    },

    uploadImage: async (
        id: string,
        file: File
    ): Promise<{ url: string }> => {
        const { token, tenantId } = await getAuthContext();

        const formData = new FormData();
        formData.append("file", file);

        return apiClient.post<{ url: string }>(
            unitEndpoints.uploadMedia(id),
            formData,
            token,
            tenantId
        );
    },

    getSummary: async (): Promise<UnitSummaryResponse> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.get<UnitSummaryResponse>(
            unitEndpoints.summary,
            token,
            tenantId
        );
    },

    remove: async (id: string): Promise<void> => {
        const { token, tenantId } = await getAuthContext();
        return apiClient.delete<void>(
            unitEndpoints.remove(id),
            token,
            tenantId
        );
    },
};
