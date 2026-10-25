import { Property } from "./property";

export type PropertyResponse = Property;

export interface PropertyPageResponse {
    content: PropertyResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}
