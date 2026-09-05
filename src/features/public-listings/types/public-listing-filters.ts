export interface PublicListingFilters {
    keyword?: string;

    location?: string;

    /** Applies to the available unit, not the property as a whole. */
    minRent?: number;
    maxRent?: number;

    /**
     * Stands in for bedroom count — there is no bedroom column, and in this
     * market supply is described by type (bedsitter, studio, apartment,
     * maisonette) rather than a number nobody entered.
     */
    propertyType?: string;

    page?: number;

    size?: number;
}

export const DEFAULT_PUBLIC_LISTING_FILTERS: PublicListingFilters = {
    keyword: "",
    location: "",
    page: 0,
    size: 20,
};