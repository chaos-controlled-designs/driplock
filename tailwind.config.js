/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  '#f8c4d8',  // soft romantic pink
        plum:     '#3f2a2f',  // warm dark text
        blush:    '#fdf0f4',  // very light pink surface
        lavender: '#e8d0e8',  // soft pink-mauve gradient end
        cream:    '#fdfaf5',  // warm beige background
        mint:     '#b8e0d8',  // gentle sage/mint accent
        rose:     '#f5dce5',  // soft dusky rose
        ivory:    '#fffcf8',  // warm near-white
        sage:     '#daeee9',  // muted mint surface
        gold:     '#C9A96E',  // warm gold accent
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft:   '0 2px 16px rgba(248,196,216,0.10)',
        medium: '0 4px 28px rgba(248,196,216,0.16)',
        strong: '0 8px 40px rgba(248,196,216,0.22)',
        glow:   '0 0 20px rgba(248,196,216,0.30)',
      },
    },
  },
  plugins: [],
};
