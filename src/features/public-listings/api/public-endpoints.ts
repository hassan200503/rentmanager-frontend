export const publicEndpoints = {
    properties: "/public/properties",
    propertyById: (id: string) =>
        `/public/properties/${id}`,

    units: "/public/units",
    unitById: (id: string) =>
        `/public/units/${id}`,

    unitsByProperty: (propertyId: string) =>
        `/public/units/property/${propertyId}`,

    longestVacantUnit: "/public/units/featured/longest-vacant", // ADDED

    // ADDED — previously missing from this registry, which is why
    // ReservationPage and ReservationWaitingPage were each hand-rolling
    // bare `fetch(...)` calls with hardcoded relative paths instead of
    // going through apiClient/appConfig.api.baseUrl like every other public
    // endpoint in this file. That bypass meant those two requests hit the
    // Next.js app's own origin instead of the backend's configured baseUrl.
    unitReservationSummary: (unitId: string) =>
        `/public/units/${unitId}/summary`,

    initiateReservation: "/public/reservations/initiate",

    reservationPaymentStatus: (paymentIntentId: string) =>
        `/public/reservations/payment-status?id=${encodeURIComponent(paymentIntentId)}`,
};