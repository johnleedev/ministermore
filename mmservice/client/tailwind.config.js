/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4fc',
          100: '#d9e8f8',
          500: '#3b82c4',
          600: '#2e6aa8',
          700: '#245585',
        },
      },
    },
  },
  plugins: [],
};
