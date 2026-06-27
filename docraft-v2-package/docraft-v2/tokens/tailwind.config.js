// tailwind.config.js — DOCRAFT.pro v2 (версия B для A/B-теста)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dc: {
          dark:       '#1A1A2E',
          'dark-2':   '#252543',
          'dark-3':   '#2E2E52',
          violet:     '#6B5CE7',
          'violet-2': '#534AB7',
          'violet-3': '#3C3489',
          'violet-50':'#EEEDFE',
          'violet-100':'#CECBF6',
          cyan:       '#00BFA5',
          'cyan-2':   '#0F6E56',
          'cyan-50':  '#E1F5EE',
          orange:     '#F5A623',
          'orange-2': '#D08010',
          'orange-50':'#FFF8EE',
          bg:         '#F8F8FC',
          surface:    '#FFFFFF',
          'surface-2':'#F3F2F9',
          text:       '#1A1A2E',
          'text-2':   '#4A4A6A',
          'text-3':   '#888899',
        },
      },
      fontFamily: {
        display: ['Epilogue', 'Sora', 'system-ui', 'sans-serif'],
        body:    ['DM Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'dc-xs':   ['10px', { lineHeight: '1.4' }],
        'dc-sm':   ['12px', { lineHeight: '1.5' }],
        'dc-base': ['14px', { lineHeight: '1.6' }],
        'dc-md':   ['16px', { lineHeight: '1.6' }],
        'dc-lg':   ['20px', { lineHeight: '1.4' }],
        'dc-xl':   ['24px', { lineHeight: '1.3' }],
        'dc-2xl':  ['30px', { lineHeight: '1.2' }],
        'dc-3xl':  ['38px', { lineHeight: '1.1' }],
      },
      spacing: {
        'dc-1':  '4px',
        'dc-2':  '8px',
        'dc-3':  '12px',
        'dc-4':  '16px',
        'dc-5':  '20px',
        'dc-6':  '24px',
        'dc-8':  '32px',
        'dc-10': '40px',
        'dc-12': '48px',
        'dc-16': '64px',
      },
      borderRadius: {
        'dc-sm': '4px',
        'dc-md': '8px',
        'dc-lg': '12px',
        'dc-xl': '16px',
      },
      boxShadow: {
        'dc-ring':       '0 0 0 3px rgba(107,92,231,0.25)',
        'dc-ring-cyan':  '0 0 0 3px rgba(0,191,165,0.25)',
        'dc-ring-dark':  '0 0 0 3px rgba(26,26,46,0.20)',
      },
      transitionDuration: {
        'dc': '150ms',
        'dc-slow': '250ms',
      },
    },
  },
  plugins: [],
}
