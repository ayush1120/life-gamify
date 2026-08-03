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
        bourbon: {
          50: '#fdf8f4',
          100: '#f9eee3',
          200: '#f2d9c3',
          300: '#e7bc98',
          400: '#d9976b',
          500: '#ce7647',
          600: '#c05c3b',
          700: '#a04733',
          800: '#823b2e',
          900: '#6a3229',
          950: '#391713',
        },
        chocolate: {
          light: '#3d251e',
          dark: '#1c100d',
          accent: '#d97706',
          gold: '#f59e0b',
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulseGlow 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
