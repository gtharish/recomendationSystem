/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#19251f',
        muted: '#68756e',
        leaf: '#28684d',
        canvas: '#f7f8f6',
      },
      boxShadow: {
        card: '0 12px 35px rgba(25, 37, 31, 0.055)',
      },
    },
  },
  plugins: [],
};

