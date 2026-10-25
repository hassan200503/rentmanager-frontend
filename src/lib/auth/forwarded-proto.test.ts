import { describe, expect, it } from "vitest";
import { httpsPublicOrigin, resolveProtoRewrite } from "./forwarded-proto";

const base = {
    method: "GET",
    forwardedProto: null as string | null,
    protocol: "http:",
    pathname: "/dashboard",
    search: "",
    httpsOrigin: "https://app.example.com",
};

describe("httpsPublicOrigin", () => {
    it("returns the origin of an https app URL", () => {
        expect(httpsPublicOrigin("https://app.example.com/")).toBe("https://app.example.com");
    });

    it("ignores a local http app URL so development is untouched", () => {
        expect(httpsPublicOrigin("http://localhost:3000")).toBeNull();
    });

    it("returns null when unset or unparseable", () => {
        expect(httpsPublicOrigin(undefined)).toBeNull();
        expect(httpsPublicOrigin("not a url")).toBeNull();
    });
});

describe("resolveProtoRewrite", () => {
    it("rewrites a plain-http GET on an https deployment", () => {
        expect(resolveProtoRewrite(base)).toEqual({
            url: "https://app.example.com/dashboard",
            proto: "https",
        });
    });

    // The case this module exists for. An earlier version deferred to the
    // header whenever it was present, which made the fix a no-op here.
    it("overrides an x-forwarded-proto of http, which is what Deno Deploy sends", () => {
        expect(resolveProtoRewrite({ ...base, forwardedProto: "http" })).toEqual({
            url: "https://app.example.com/dashboard",
            proto: "https",
        });
    });

    it("replaces the internal socket origin, not merely the scheme", () => {
        // req.url on Deno Deploy is http://0.0.0.0:3000, so the host has to
        // come from configuration too or Clerk builds URLs nobody can reach.
        expect(resolveProtoRewrite(base)?.url).toBe("https://app.example.com/dashboard");
    });

    it("keeps the query string, which carries the sign-in return target", () => {
        expect(resolveProtoRewrite({ ...base, search: "?a=1&b=2" })?.url).toBe(
            "https://app.example.com/dashboard?a=1&b=2"
        );
    });

    it("does nothing when the request is already https end to end", () => {
        expect(
            resolveProtoRewrite({ ...base, protocol: "https:", forwardedProto: "https" })
        ).toBeNull();
        expect(resolveProtoRewrite({ ...base, protocol: "https:" })).toBeNull();
    });

    it("still corrects a request served over https but reported as http", () => {
        expect(
            resolveProtoRewrite({ ...base, protocol: "https:", forwardedProto: "http" })
        ).not.toBeNull();
    });

    it("does nothing in a development build with no https origin", () => {
        expect(resolveProtoRewrite({ ...base, httpsOrigin: null })).toBeNull();
        expect(
            resolveProtoRewrite({ ...base, httpsOrigin: null, forwardedProto: "http" })
        ).toBeNull();
    });

    it("leaves requests with a body alone rather than cloning their stream", () => {
        expect(resolveProtoRewrite({ ...base, method: "POST" })).toBeNull();
    });

    it("covers HEAD as well as GET", () => {
        expect(resolveProtoRewrite({ ...base, method: "HEAD" })).not.toBeNull();
    });

    it("is not fooled by casing or padding in the header", () => {
        expect(
            resolveProtoRewrite({ ...base, protocol: "https:", forwardedProto: " HTTPS " })
        ).toBeNull();
    });
});
