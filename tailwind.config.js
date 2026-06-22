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
        // PayPal-inspired primary palette
        primary: "#0070ba",
        "primary-dark": "#005a99",
        "primary-light": "#e6f2ff",
        
        // Secondary palette
        secondary: "#003087",
        "secondary-dark": "#002266",
        
        // Status colors
        success: "#28a745",
        "success-dark": "#218838",
        warning: "#ffc107",
        "warning-dark": "#e0a800",
        danger: "#dc3545",
        "danger-dark": "#c82333",
        
        // Neutral colors
        background: "#f8f9fa",
      },
      spacing: {
        // Extended 8px spacing system
        1.5: "0.375rem",
        3.5: "0.875rem",
        4.5: "1.125rem",
        5.5: "1.375rem",
        6.5: "1.625rem",
        7.5: "1.875rem",
        8.5: "2.125rem",
        9.5: "2.375rem",
        10.5: "2.625rem",
        11: "2.75rem",
        11.5: "2.875rem",
        12.5: "3.125rem",
        13: "3.25rem",
        13.5: "3.375rem",
        14: "3.5rem",
        14.5: "3.625rem",
        15: "3.75rem",
        16.5: "4.125rem",
        17: "4.25rem",
        17.5: "4.375rem",
        18: "4.5rem",
        18.5: "4.625rem",
        19: "4.75rem",
        20.5: "5.125rem",
      },
      borderRadius: {
        // Consistent rounded corners
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        // Subtle elevation shadows
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
