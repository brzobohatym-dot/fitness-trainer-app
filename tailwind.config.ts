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
          50: '#f0f3f8',
          100: '#dae1ef',
          200: '#b5c3df',
          300: '#8fa5cf',
          400: '#6383b3',
          500: '#3a5d8f',
          600: '#253D66',
          700: '#1F3357',
          800: '#192948',
          900: '#131F39',
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
        'gradient-brand': 'linear-gradient(135deg, #253D66 0%, #3a5d8f 50%, #D4722A 100%)',
        'gradient-dark': 'linear-gradient(180deg, #131F39 0%, #253D66 100%)',
      },
      boxShadow: {
        'brand': '0 4px 20px rgba(37, 61, 102, 0.3)',
        'brand-lg': '0 10px 40px rgba(37, 61, 102, 0.4)',
        'accent': '0 4px 20px rgba(212, 114, 42, 0.3)',
      },
    },
  },
  plugins: [],
}
export default config
