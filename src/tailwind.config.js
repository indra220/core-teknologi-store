// tailwind.config.js

import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
const config = {
  // UBAH 'class' MENJADI 'media'
  darkMode: 'media',

  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', ...fontFamily.sans],
        heading: ['var(--font-jakarta-sans)', ...fontFamily.sans],
      },
      colors: {
        'light-gradient-start': '#F8FAFC',
        'light-gradient-end': '#F1F5F9',
      },
    },
  },
  plugins: [],
};

export default config;