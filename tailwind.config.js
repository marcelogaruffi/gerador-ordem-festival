/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7A0019',
        secondary: '#F7F7F7',
        success: '#00A86B',
        warning: '#F59E0B',
        danger: '#DC2626',
        coxia: {
          dark: '#1F1F1F',
          light: '#FFFFFF',
          gray: '#E5E7EB',
          text: '#374151'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
