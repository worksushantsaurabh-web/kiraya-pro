/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F3F4F6', // Soft light gray for sections
        primary: '#000000',
        secondary: '#6b7280', // Text-gray-500
        muted: '#9ca3af', // Text-gray-400
        accent: '#5E17EB', // Urban Company's purple accent (used for select highlights)
        success: '#10b981', // Emerald-500
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        outfit: ['"Outfit"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
