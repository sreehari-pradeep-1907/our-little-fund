import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FAF8F5',
          dark: '#F0EDE8',
        },
        blush: {
          DEFAULT: '#F4E5E8',
          dark: '#E8D5D9',
        },
        rose: {
          DEFAULT: '#C98798',
          light: '#D9A5B2',
          dark: '#A86B7C',
        },
        lavender: {
          DEFAULT: '#EAE5F5',
          dark: '#D9D3E8',
        },
        sage: {
          DEFAULT: '#DCE8DD',
          dark: '#CCD8CD',
        },
        charcoal: {
          DEFAULT: '#29272B',
          light: '#3A383E',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'ring-progress': 'ringProgress 1.5s ease-out forwards',
        'count-up': 'countUp 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        ringProgress: {
          '0%': { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: '0' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(41, 39, 43, 0.07), 0 10px 20px -2px rgba(41, 39, 43, 0.04)',
        'card': '0 4px 25px -5px rgba(41, 39, 43, 0.08), 0 10px 30px -5px rgba(41, 39, 43, 0.05)',
        'elevated': '0 10px 40px -10px rgba(41, 39, 43, 0.1), 0 20px 50px -15px rgba(41, 39, 43, 0.08)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config