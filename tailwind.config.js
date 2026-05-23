/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        cream: '#F5EFE4',
        clay: '#C84B31',
        clayDark: '#A23A24',
        forest: '#2C3E2D',
        sand: '#E8DCC4',
        ink: '#1A1A1A',
        muted: '#6B6157',
      },
    },
  },
  plugins: [],
};
