/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@talon-sandbox/tokens/preset')],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
