/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  '#ffc1b8',  // soft peach-pink
        plum:     '#3f2a2a',  // warm dark text
        blush:    '#fff0eb',  // very light peach surface
        lavender: '#ffd4c4',  // coral blush gradient end — NO MORE PURPLE
        cream:    '#fff8f0',  // warm peach-cream background
        mint:     '#a8e6d8',  // soft seafoam teal accent
        rose:     '#ffb8a8',  // deeper peach
        ivory:    '#fffdf9',  // near-white warm
        sage:     '#c8f0e8',  // light seafoam surface
        gold:     '#C9A96E',  // warm gold
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft:   '0 2px 16px rgba(255,193,184,0.12)',
        medium: '0 4px 28px rgba(255,193,184,0.18)',
        strong: '0 8px 40px rgba(255,193,184,0.24)',
        glow:   '0 0 20px rgba(255,193,184,0.30)',
      },
    },
  },
  plugins: [],
};
