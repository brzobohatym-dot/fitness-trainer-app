import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef1f7',
          100: '#d5dcea',
          200: '#aab9d5',
          300: '#7f96c0',
          400: '#4e6a9a',
          500: '#2a4170',
          600: '#1C2B4A',
          700: '#17233D',
          800: '#121B30',
          900: '#0D1323',
        },
        accent: {
          50: '#fdf2e9',
          100: '#fadfc8',
          200: '#f5bf91',
          300: '#E89B57',
          400: '#D4722A',
          500: '#BF6524',
          600: '#A3561E',
          700: '#7D4217',
          800: '#573011',
          900: '#311B09',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #1C2B4A 0%, #2a4170 50%, #D4722A 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0D1323 0%, #1C2B4A 100%)',
      },
      boxShadow: {
        'brand': '0 4px 20px rgba(28, 43, 74, 0.3)',
        'brand-lg': '0 10px 40px rgba(28, 43, 74, 0.4)',
        'accent': '0 4px 20px rgba(212, 114, 42, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
