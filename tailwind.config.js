/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:  '#f8a8c2',
        gold:     '#C9A96E',
        plum:     '#374151',
        blush:    '#fde8f0',
        sage:     '#ccfbf1',
        lavender: '#f3e8ff',
        cream:    '#fdf4f8',
        rose:     '#fda4af',
        ivory:    '#fff5f9',
        mint:     '#99f6e4',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft:   '0 2px 16px rgba(248,168,194,0.14)',
        medium: '0 4px 28px rgba(248,168,194,0.22)',
        strong: '0 8px 40px rgba(248,168,194,0.28)',
        glow:   '0 0 24px rgba(248,168,194,0.50)',
      },
    },
  },
  plugins: [],
};
