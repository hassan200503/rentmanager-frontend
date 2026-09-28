import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * Cloudflare Workers build config for the OpenNext adapter.
 *
 * Exists because Netlify's credit-based free plan suspends the whole site when
 * the allowance runs out — which it did — and Cloudflare's free Workers plan
 * has no such mechanism: unlimited bandwidth, 500 builds a month, commercial
 * use allowed, no card.
 */
export default defineCloudflareConfig();
