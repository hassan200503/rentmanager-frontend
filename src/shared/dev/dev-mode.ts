const DEV_RENTER_COOKIE = "_dev_portal";
const DEV_RENTER_VALUE = "renter";

export function isDevRenterMode(): boolean {
    if (typeof document === "undefined") return false;
    return document.cookie
        .split("; ")
        .some((c) => c === `${DEV_RENTER_COOKIE}=${DEV_RENTER_VALUE}`);
}

export function setDevRenterMode(): void {
    document.cookie = `${DEV_RENTER_COOKIE}=${DEV_RENTER_VALUE}; path=/; max-age=86400`;
}

export function clearDevRenterMode(): void {
    document.cookie = `${DEV_RENTER_COOKIE}=; path=/; max-age=0`;
}