/** @type {import('tailwindcss').Config} */
export default {
  presets: [require('../talon-sandbox-ui/packages/tokens/dist/tailwind.preset.cjs')],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
