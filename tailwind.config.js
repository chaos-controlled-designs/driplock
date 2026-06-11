/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  '#E8847A',
        gold:     '#C9A96E',
        plum:     '#2D1B35',
        blush:    '#F5D5CF',
        sage:     '#D4E8D4',
        lavender: '#E8D5F5',
        cream:    '#FDF8F5',
        rose:     '#F2D9D9',
        ivory:    '#F7F3EE',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft:   '0 2px 15px rgba(45,27,53,0.08)',
        medium: '0 4px 25px rgba(45,27,53,0.12)',
        strong: '0 8px 40px rgba(45,27,53,0.16)',
        glow:   '0 0 20px rgba(232,132,122,0.3)',
      },
    },
  },
  plugins: [],
};