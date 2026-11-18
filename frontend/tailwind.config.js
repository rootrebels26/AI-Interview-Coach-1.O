/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nitya: {
          bg: '#f5f9ff',
          cloud: '#f8fbff',
          navy: '#0b1220',
          dark: '#07111f',
          deep: '#020617',
          blue: '#1e3a8a',
          royal: '#2563eb',
          cyan: '#22d3ee',
          muted: '#5b6475',
          border: 'rgba(255, 255, 255, 0.7)',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        }
      }
    },
  },
  plugins: [],
}
