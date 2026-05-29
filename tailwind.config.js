/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Baseball diamond green
        field: {
          DEFAULT: "#1a4731",
          light: "#2d6a4f",
          dark: "#0f2d1e",
        },
        // Dirt/clay
        dirt: {
          DEFAULT: "#8b5e3c",
          light: "#c4864a",
        },
        // Night game sky
        night: {
          DEFAULT: "#0f172a",
          card: "#1e293b",
          border: "#334155",
          text: "#94a3b8",
        },
        // Star ratings
        gold: "#f59e0b",
        silver: "#94a3b8",
        // Status colors
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
        info: "#3b82f6",
      },
    },
  },
  plugins: [],
};
