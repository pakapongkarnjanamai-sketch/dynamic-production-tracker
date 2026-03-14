/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#16a34a',
          red:   '#dc2626',
          amber: '#d97706',
        },
      },
      fontSize: {
        '2xl-touch': ['1.75rem', { lineHeight: '2.25rem' }],
      },
    },
  },
  plugins: [],
};
