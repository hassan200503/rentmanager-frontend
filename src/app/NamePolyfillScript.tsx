/**
 * Critical inline script that MUST run before ANY Next.js code.
 * 
 * Defines the __name helper function that Next.js/Turbopack uses for
 * function name preservation. This prevents "ReferenceError: __name is not defined".
 */

export function NamePolyfillScript() {
  return (
    <script
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
