import { usePropertyMediaQuery } from "../queries/use-property-media-query";

export const usePropertyMedia = (propertyId: string) => {
    return usePropertyMediaQuery(propertyId);
};