import { UnitListParams } from "../types/unit-request";

export const unitKeys = {
    all: ["units"] as const,
    lists: () => [...unitKeys.all, "list"] as const,
    list: (params: UnitListParams) => [...unitKeys.lists(), params] as const,
    details: () => [...unitKeys.all, "detail"] as const,
    detail: (id: string) => [...unitKeys.details(), id] as const,
};
