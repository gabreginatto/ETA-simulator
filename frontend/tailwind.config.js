/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industrial/Engineering color palette
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Equipment status colors
        feed: {
          light: '#dbeafe',
          DEFAULT: '#3b82f6',
          dark: '#1e40af',
        },
        polymer: {
          light: '#f3e8ff',
          DEFAULT: '#a855f7',
          dark: '#7c3aed',
        },
        dewatering: {
          light: '#ffedd5',
          DEFAULT: '#f97316',
          dark: '#c2410c',
        },
        // Status colors
        success: {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#15803d',
        },
        warning: {
          light: '#fef9c3',
          DEFAULT: '#eab308',
          dark: '#a16207',
        },
        error: {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'flow': 'flow 1.5s ease-in-out infinite',
      },
      keyframes: {
        flow: {
          '0%, 100%': { strokeDashoffset: '0' },
          '50%': { strokeDashoffset: '10' },
        },
      },
    },
  },
  plugins: [],
}
