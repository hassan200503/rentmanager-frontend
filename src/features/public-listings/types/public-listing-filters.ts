export interface PublicListingFilters {
    keyword?: string;

    page?: number;

    size?: number;
}

export const DEFAULT_PUBLIC_LISTING_FILTERS: PublicListingFilters = {
    keyword: "",
    page: 0,
    size: 20,
};