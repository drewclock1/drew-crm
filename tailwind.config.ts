import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold:    '#C9951A',
          'gold-light': '#F0C84A',
          'gold-bg':    '#FBF5E6',
          blue:    '#2B7FD4',
          'blue-light': '#4F9EF0',
          'blue-bg':    '#EBF4FF',
          navy:    '#0C3B6E',
          'navy-light': '#1A5BA8',
          'surface-blue': '#E8F3FC',
          'surface-gold': '#FBF3DC',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '6px',
        md: '10px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card:    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-lg': '0 4px 16px rgba(0,0,0,0.08)',
        'gold':  '0 4px 12px rgba(201,149,26,0.35)',
        'blue':  '0 4px 12px rgba(43,127,212,0.3)',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      },
    },
  },
  plugins: [],
}

export default config
