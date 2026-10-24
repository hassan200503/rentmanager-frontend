/**
 * Polyfill for Next.js __name function
 * 
 * This fixes the "Uncaught ReferenceError: __name is not defined" error
 * that occurs when Next.js inline scripts reference __name before it's loaded.
 * 
 * The __name function is used by Next.js for function name preservation during
 * minification. It's normally injected by the bundler but can be missing in
 * certain build configurations (especially with OpenNext + Cloudflare Workers).
 */

// Define __name globally before any Next.js code runs
if (typeof globalThis !== 'undefined' && typeof (globalThis as any).__name === 'undefined') {
  (globalThis as any).__name = function(target: any, name: string) {
    Object.defineProperty(target, 'name', { value: name, configurable: true });
    return target;
  };
}

export {}; // Make this a module
