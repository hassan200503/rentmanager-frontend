import Script from 'next/script';
import type { JSX } from 'react';

/**
 * Critical inline script that MUST run before ANY Next.js code.
 * 
 * Defines the __name helper function that Next.js/Turbopack uses for
 * function name preservation during minification. This prevents the
 * "ReferenceError: __name is not defined" error that occurs when
 * deploying Next.js 16+ to Cloudflare Workers via OpenNext.
 * 
 * The polyfill is injected with `beforeInteractive` strategy to ensure
 * it loads before Next.js's theme script that calls `__name(k4, "k4")`.
 * 
 * @see https://github.com/opennextjs/opennextjs-cloudflare/issues
 * @returns Script component that injects the __name polyfill
 */
export function NamePolyfillScript(): JSX.Element {
  return (
    <Script
      id="name-polyfill"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          // Define __name before any Next.js code runs
          if (typeof globalThis !== 'undefined' && typeof globalThis.__name === 'undefined') {
            globalThis.__name = function(target, name) {
              Object.defineProperty(target, 'name', { value: name, configurable: true });
              return target;
            };
          }
        `,
      }}
    />
  );
}
