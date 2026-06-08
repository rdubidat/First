/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Baloo 2"', 'Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Leon — warm golden-retriever palette
        leon: {
          50: '#fdf8f1',
          100: '#faecd8',
          200: '#f3d6ad',
          300: '#ebb978',
          400: '#e39b4c',
          500: '#d97e2d',
          600: '#c06322',
          700: '#9f4a1f',
          800: '#813c20',
          900: '#6a331e',
        },
        bark: {
          50: '#f6f5f4',
          100: '#e7e3df',
          200: '#cfc7bf',
          300: '#b0a397',
          400: '#928172',
          500: '#776758',
          600: '#5f5246',
          700: '#4d4239',
          800: '#2f2823',
          900: '#1d1916',
          950: '#120f0d',
        },
      },
      boxShadow: {
        float: '0 24px 60px -12px rgba(45, 30, 15, 0.45), 0 8px 24px -8px rgba(45, 30, 15, 0.35)',
        'glow-leon': '0 0 0 4px rgba(217, 126, 45, 0.18)',
      },
      keyframes: {
        'pop-in': {
          '0%': { transform: 'scale(0.85) translateY(6px)', opacity: '0' },
          '60%': { transform: 'scale(1.03)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        'task-complete': {
          '0%': { transform: 'translateX(0)', opacity: '1', maxHeight: '120px' },
          '35%': { transform: 'translateX(6px)' },
          '100%': { transform: 'translateX(60px)', opacity: '0', maxHeight: '0px', marginBottom: '0', paddingTop: '0', paddingBottom: '0' },
        },
        'check-bounce': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.35)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        'paw-stamp': {
          '0%': { transform: 'scale(0) rotate(-25deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(-12deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-12deg)', opacity: '0' },
        },
        'wag': {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%': { transform: 'rotate(8deg)' },
        },
        'float-bob': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(120px) rotate(360deg)', opacity: '0' },
        },
        'ring-pulse': {
          '0%': { transform: 'scale(0.6)', opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'task-complete': 'task-complete 0.55s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'check-bounce': 'check-bounce 0.5s ease-out',
        'paw-stamp': 'paw-stamp 0.7s ease-out forwards',
        'wag': 'wag 0.4s ease-in-out infinite',
        'float-bob': 'float-bob 4s ease-in-out infinite',
        'ring-pulse': 'ring-pulse 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}
