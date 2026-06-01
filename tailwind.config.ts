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
          gold:          '#C9951A',
          'gold-light':  '#E8AE2A',
          'gold-bg':     '#FBF5E6',
          blue:          '#2B7FD4',
          'blue-light':  '#4F9EF0',
          'blue-bg':     '#EBF4FF',
          navy:          '#0C3B6E',
          'navy-light':  '#1A5BA8',
          'surface-blue':'#E8F3FC',
          'surface-gold':'#FBF3DC',
        },
        status: {
          danger:  '#f43f5e',
          success: '#4ade80',
          warning: '#fbbf24',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        sm:  '6px',
        md:  '10px',
        lg:  '12px',
        xl:  '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'xs':       '0 1px 2px rgba(0,0,0,0.05)',
        'card':     '0 2px 8px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05)',
        'card-lg':  '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.07)',
        'gold':     '0 4px 16px rgba(201,149,26,0.35)',
        'gold-glow':'0 0 24px rgba(201,149,26,0.3)',
        'blue':     '0 4px 16px rgba(43,127,212,0.3)',
        'blue-glow':'0 0 24px rgba(43,127,212,0.25)',
        'navy':     '0 4px 14px rgba(12,59,110,0.35)',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        'xs':  ['11px', '16px'],
        'sm':  ['13px', '18px'],
      },
      spacing: {
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        countUp: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        leaderBar: {
          from: { width: '0' },
          to:   { width: '100%' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,149,26,0)' },
          '50%':       { boxShadow: '0 0 12px 4px rgba(201,149,26,0.25)' },
        },
      },
      animation: {
        'slide-up':    'slideUp .35s cubic-bezier(.22,1,.36,1) both',
        'fade-in':     'fadeIn .3s ease both',
        'count-up':    'countUp .4s cubic-bezier(.22,1,.36,1) both',
        'leader-bar':  'leaderBar 1s cubic-bezier(.22,1,.36,1) both',
        'pulse-glow':  'pulseGlow 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
