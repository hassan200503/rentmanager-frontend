/**
 * A renter as their landlord sees them (GET /renters).
 *
 * `hasAccount` is false while the tenancy exists only as the landlord's
 * record: the person can still be billed and have payments recorded, and the
 * record is claimed automatically the first time they sign in with this email
 * (the backend's RenterIdentityLinker). Email and national id are optional
 * because many renters give only a phone number.
 */
export interface Renter {
    id: string;
    fullName: string;
    phone: string;
    email: string | null;
    nationalId: string | null;
    hasAccount: boolean;
}

export interface AddRenterRequest {
    fullName: string;
    phone: string;
    email?: string;
    nationalId?: string;
}
