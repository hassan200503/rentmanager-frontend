export interface PublicListingFilters {
    keyword?: string;

    location?: string;

    page?: number;

    size?: number;
}

export const DEFAULT_PUBLIC_LISTING_FILTERS: PublicListingFilters = {
    keyword: "",
    location: "",
    page: 0,
    size: 20,
};