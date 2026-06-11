/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  '#ec4899',
        gold:     '#C9A96E',
        plum:     '#2D1B35',
        blush:    '#fce7f3',
        sage:     '#d1fae5',
        lavender: '#ede9fe',
        cream:    '#fff0f5',
        rose:     '#fda4af',
        ivory:    '#fdf4f8',
        mint:     '#a1e3d3',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft:   '0 2px 15px rgba(236,72,153,0.10)',
        medium: '0 4px 25px rgba(236,72,153,0.18)',
        strong: '0 8px 40px rgba(236,72,153,0.22)',
        glow:   '0 0 20px rgba(236,72,153,0.45)',
      },
    },
  },
  plugins: [],
};
