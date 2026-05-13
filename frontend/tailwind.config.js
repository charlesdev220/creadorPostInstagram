/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        'app-primary':        '#050505',
        'app-secondary':      '#121214',
        'app-text-primary':   '#ffffff',
        'app-text-secondary': '#a1a1aa',
        'accent-purple':      '#833ab4',
        'accent-red':         '#fd1d1d',
        'accent-orange':      '#fcb045',
      },
    },
  },
  plugins: [],
};
