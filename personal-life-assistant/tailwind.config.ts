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
        // 奶油风配色
        'cream-bg': '#fdfdfd',
        'cream-card': '#ffffff',
        'cream-border': '#f0eae4',
        'cream-input': '#fdfdfd',
        'cream-text': '#5d504b',
        'cream-text-light': '#a89f9a',
        'cream-text-dark': '#8b7d77',
        'cream-accent': '#c5b3a7',
        'cream-accent-hover': '#a89383',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
    },
  },
  plugins: [],
}
export default config