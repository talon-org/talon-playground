/** @type {import('tailwindcss').Config} */
export default {
  presets: [require('@talon-sandbox/tokens/preset')],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
