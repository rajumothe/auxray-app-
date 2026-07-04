/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#1e293b', // Deep slate for sidebar
          primary: '#0ea5e9', // Solar blue for buttons
          light: '#f8fafc', // Light gray for backgrounds
        }
      }
    },
  },
  plugins: [],
}