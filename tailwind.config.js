/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan all files that may contain Tailwind classes
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        // Design‑system colours – mapped to the CSS variables defined in globals.css
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        "primary-light": "var(--color-primary-light)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        warning: "var(--color-warning)",
        info: "var(--color-info)",
        // Keep the default gray palette (Tailwind already provides it)
      },
      // Expose the same values for border and ring utilities
      borderColor: (theme) => ({
        primary: theme("colors.primary"),
        "primary-hover": theme("colors.primary-hover"),
        "primary-light": theme("colors.primary-light"),
      }),
      ringColor: (theme) => ({
        primary: theme("colors.primary"),
        "primary-light": theme("colors.primary-light"),
      }),
    },
  },
  plugins: [],
};
