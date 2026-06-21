/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.css",
  ],
  theme: {
    extend: {
      colors: {
        // PayPal‑inspired primary palette – used by the original design.
        primary: "#0070ba",
        "primary-light": "#e6f2ff",
        secondary: "#003087",
        danger: "#d9534f",
      },
    },
  },
  plugins: [],
};
