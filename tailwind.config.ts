import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
    './pages/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'system-ui',
          'sans-serif',
        ],
      },
      colors: {
        mac: {
          bg: '#f4f7f2',
          card: '#ffffff',
          sidebar: 'rgba(244, 248, 242, 0.92)',
          border: '#e1eade',
          text: '#142217',
          muted: '#627666',
          accent: '#239651',
          accentHover: '#1c7e43',
          success: '#16a34a',
          warning: '#f59e0b',
        },
        macDark: {
          bg: '#0c1610',
          card: '#142218',
          cardElevated: '#1c2f22',
          sidebar: 'rgba(14, 25, 18, 0.92)',
          border: '#243b2b',
          text: '#f0f7f2',
          muted: '#8ea593',
          accent: '#4ade80',
          accentHover: '#22c55e',
          success: '#4ade80',
          warning: '#fbbf24',
        },
        cho: {
          DEFAULT: '#d97706',
          dark: '#fbbf24',
          bg: '#fef3c7',
          bgDark: '#291b00',
        },
      },
      boxShadow: {
        'mac-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 1px 3px 1px rgba(0, 0, 0, 0.02)',
        'mac-md': '0 4px 12px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'mac-lg': '0 12px 28px 0 rgba(0, 0, 0, 0.08), 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
} satisfies Config
