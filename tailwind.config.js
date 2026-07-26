/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-arabic)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Deep judicial navy + warm auction gold
        ink: {
          50: '#f4f6f9',
          100: '#e6ebf1',
          200: '#c6d2e0',
          300: '#9fb2c9',
          400: '#6f89a9',
          500: '#4d6889',
          600: '#3a4f6b',
          700: '#2c3d54',
          800: '#1e2b3d',
          900: '#132030',
          950: '#0b1420',
        },
        gold: {
          50: '#fbf7ee',
          100: '#f5ead0',
          200: '#ebd3a0',
          300: '#dfb668',
          400: '#d29b3e',
          500: '#c4842f',
          600: '#a86826',
          700: '#874e22',
          800: '#6f4022',
          900: '#5e3620',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,32,53,0.04), 0 8px 24px -12px rgba(16,32,53,0.18)',
        'card-hover': '0 4px 12px rgba(16,32,53,0.08), 0 20px 40px -16px rgba(16,32,53,0.28)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .4s ease both',
      },
    },
  },
  plugins: [],
};
