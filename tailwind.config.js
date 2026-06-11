/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  '#f8c7d9',
        gold:     '#C9A96E',
        plum:     '#374151',
        blush:    '#fef0f5',
        sage:     '#e4f9f2',
        lavender: '#d1c4f0',
        cream:    '#fdf4f8',
        rose:     '#f9b8cc',
        ivory:    '#fff9fb',
        mint:     '#a8e6cf',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft:   '0 2px 16px rgba(248,199,217,0.14)',
        medium: '0 4px 28px rgba(248,199,217,0.22)',
        strong: '0 8px 40px rgba(248,199,217,0.28)',
        glow:   '0 0 24px rgba(248,199,217,0.55)',
      },
    },
  },
  plugins: [],
};
