const base = "/users";

export const userEndpoints = {
    base,
    invite: `${base}/invite`,
    me: `${base}/me`,
    list: base,
    member: (userId: string) => `${base}/${userId}`,
};