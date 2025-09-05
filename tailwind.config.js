/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(220, 15%, 98%)',
        accent: 'hsl(160, 70%, 45%)',
        primary: 'hsl(210, 70%, 50%)',
        surface: 'hsl(0, 0%, 100%)',
        textPrimary: 'hsl(220, 15%, 8%)',
        textSecondary: 'hsl(220, 15%, 40%)',
      },
      borderRadius: {
        'lg': '16px',
        'md': '10px',
        'sm': '6px',
      },
      spacing: {
        'sm': '8px',
        'md': '12px',
        'lg': '20px',
        'xl': '32px',
      },
      boxShadow: {
        'card': '0 4px 16px hsla(0, 0%, 0%, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
    },
  },
  plugins: [],
}