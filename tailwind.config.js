/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        excelHeader: '#FFFFF2CC',
        excelYellow: '#FFFFFF00',
      }
    },
  },
  plugins: [],
}
