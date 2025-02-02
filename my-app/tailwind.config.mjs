/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#93C5FD",   // Light Blue
        secondary: "#FDE68A", // Light Yellow
        background: "#FFFFFF", // White
        text: "#D1D5DB",       // Light Gray
      },
    },
  },
  plugins: [],
};
