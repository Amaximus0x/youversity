/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins'],
        // Removing any other font families to ensure Poppins is the only option
      },
    },
  },
  plugins: [],
}