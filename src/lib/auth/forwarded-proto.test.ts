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

    it("keeps the query string, which carries the sign-in return target", () => {
        expect(resolveProtoRewrite({ ...base, search: "?a=1&b=2" })?.url).toBe(
            "https://app.example.com/dashboard?a=1&b=2"
        );
    });

    it("believes a host that sets x-forwarded-proto itself", () => {
        expect(resolveProtoRewrite({ ...base, forwardedProto: "http" })).toBeNull();
    });

    it("does nothing when the request already arrived over https", () => {
        expect(resolveProtoRewrite({ ...base, protocol: "https:" })).toBeNull();
    });

    it("does nothing in a development build with no https origin", () => {
        expect(resolveProtoRewrite({ ...base, httpsOrigin: null })).toBeNull();
    });

    it("leaves requests with a body alone rather than cloning their stream", () => {
        expect(resolveProtoRewrite({ ...base, method: "POST" })).toBeNull();
    });

    it("covers HEAD as well as GET", () => {
        expect(resolveProtoRewrite({ ...base, method: "HEAD" })).not.toBeNull();
    });
});
