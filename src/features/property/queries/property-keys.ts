import { PropertyFilterState } from "../hooks/use-property-filters";

export const propertyKeys = {
    all: ["properties"] as const,
    list: (filters?: PropertyFilterState) => ["properties", "list", filters],
    detail: (id: string) => ["properties", "detail", id],
};
