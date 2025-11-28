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
        // Semantic Surface System - uses CSS variables for theming
        // Using rgb() with CSS variable channels to preserve runtime resolution
        surface: {
          canvas: 'rgb(var(--surface-canvas-rgb) / <alpha-value>)',
          elevated: 'rgb(var(--surface-elevated-rgb) / <alpha-value>)',
          float: 'var(--surface-float)',
          overlay: 'var(--surface-overlay)',
          highlight: 'rgb(var(--surface-highlight-rgb) / <alpha-value>)',
          muted: 'rgb(var(--surface-muted-rgb) / <alpha-value>)',
        },
        // Semantic Content System
        content: {
          primary: 'rgb(var(--content-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--content-secondary-rgb) / <alpha-value>)',
          subtle: 'rgb(var(--content-subtle-rgb) / <alpha-value>)',
          inverse: 'rgb(var(--content-inverse-rgb) / <alpha-value>)',
          accent: 'rgb(var(--content-accent-rgb) / <alpha-value>)',
        },
        // Glass/frost effects
        glass: {
          DEFAULT: 'var(--glass-bg)',
          light: 'var(--glass-light)',
          border: 'var(--glass-border)',
        },
        // Primary Brand - Engineering Blue
        primary: {
          DEFAULT: '#0ea5e9',
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
          950: '#082f49',
        },
        // Equipment status colors (for data visualization)
        viz: {
          feed: '#22d3ee',      // Cyan
          polymer: '#a78bfa',   // Violet
          pump: '#38bdf8',      // Sky blue
          clarifier: '#60a5fa', // Blue
          thickener: '#34d399', // Emerald
          dewatering: '#fb923c', // Orange
          cake: '#fbbf24',      // Amber
          liquid: '#06b6d4',    // Cyan
        },
        // Status colors
        status: {
          success: '#22c55e',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
        display: ['Geist', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'dock': 'var(--shadow-dock)',
        'float': 'var(--shadow-float)',
        'glow-blue': '0 0 30px rgba(14, 165, 233, 0.3), 0 0 60px rgba(14, 165, 233, 0.1)',
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.2)',
        'inner-light': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'flow': 'flow 1.5s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        flow: {
          '0%, 100%': { strokeDashoffset: '0' },
          '50%': { strokeDashoffset: '10' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
