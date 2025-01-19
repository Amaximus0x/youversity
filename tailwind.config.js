/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins'],
      },
      colors: {
        'brand-red': '#EE434A',
        'brand-turquoise': '#42C1C8',
        'light-text-primary': '#000000',
        'dark-text-primary': '#FFFFFF',
        'light-text-secondary': '#494848',
        'dark-text-secondary': '#A3A3A3',
        'light-bg-primary': '#FFFFFF',
        'dark-bg-primary': '#1A1A1A',
        'light-bg-secondary': '#F5F5F5',
        'dark-bg-secondary': '#2A2A2A',
        'light-border': 'rgba(0,0,0,0.05)',
        'dark-border': 'rgba(255,255,255,0.1)',
      },
      backgroundImage: {
        'gradient-light': 'linear-gradient(to bottom, #FFF2F3, #FFFFFF, #EDFEFF)',
        'gradient-dark': 'linear-gradient(180deg, #1E3443 0%, #2A4D61 100%)',
      },
    },
  },
  plugins: [],
}