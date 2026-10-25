import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: "/",
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: "/listings",
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: "/public/sign-up",
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.6,
        },
        {
            url: "/public/sign-in",
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.5,
        },
        {
            url: "/legal/privacy",
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: "/legal/terms",
            lastModified: new Date(),
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ];
}