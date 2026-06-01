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
          blue: '#2B7FD4',
          gold: '#C9951A',
          navy: '#0C3B6E',
          'surface-blue': '#E8F3FC',
          'surface-gold': '#FBF3DC',
        },
      },
    },
  },
  plugins: [],
}
export default config
