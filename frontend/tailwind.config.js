/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ey-yellow': '#ffe600',
        'ey-yellow-dark': '#e6cf00',
        'ey-black': '#2e2e38',
        'ey-confident-black': '#1a1a24',
        'ey-off-white': '#f6f6fa',
        'ey-gray-light': '#c4c4cd',
        'ey-gray': '#747480',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'info': '#3b82f6',
      },
    },
  },
  plugins: [],
}
