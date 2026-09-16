const base = "/users";

export const userEndpoints = {
    base,
    invite: `${base}/invite`,
    me: `${base}/me`,
    access: `${base}/me/access`,
    list: base,
    member: (userId: string) => `${base}/${userId}`,
};