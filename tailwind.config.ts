import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0fa',
          100: '#d1e1f5',
          200: '#a3c3eb',
          300: '#75a5e1',
          400: '#4a87d7',
          500: '#2d5a9e',
          600: '#1e4a8d',
          700: '#183c73',
          800: '#122e59',
          900: '#0c1f3f',
        },
        kometa: {
          blue: '#1e4a8d',
          lightblue: '#4a87d7',
          dark: '#0c1f3f',
          white: '#ffffff',
        },
      },
      backgroundImage: {
        'gradient-kometa': 'linear-gradient(135deg, #1e4a8d 0%, #2d5a9e 50%, #4a87d7 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0c1f3f 0%, #1e4a8d 100%)',
      },
      boxShadow: {
        'kometa': '0 4px 20px rgba(30, 74, 141, 0.3)',
        'kometa-lg': '0 10px 40px rgba(30, 74, 141, 0.4)',
      },
    },
  },
  plugins: [],
}
export default config
