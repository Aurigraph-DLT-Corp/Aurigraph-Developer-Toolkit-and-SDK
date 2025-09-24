/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  // Ensure all classes are generated
  safelist: [
    'bg-red-50',
    'bg-red-100',
    'bg-red-200',
    'border-red-200',
    'text-red-600',
    'text-red-700',
    'text-red-800',
    'bg-green-50',
    'bg-green-100',
    'border-green-200',
    'text-green-600',
    'text-green-700',
    'text-green-800',
    'bg-blue-50',
    'bg-blue-100',
    'border-blue-200',
    'text-blue-600',
    'text-blue-700',
    'text-blue-800',
    'bg-yellow-50',
    'text-yellow-500',
    'bg-purple-50',
    'bg-purple-600',
    'text-purple-600',
    'hover:bg-purple-700',
    'min-h-screen',
    'flex',
    'items-center',
    'justify-center',
    'space-x-3',
    'space-y-2',
    'space-y-4',
    'rounded-lg',
    'shadow-lg',
    'p-4',
    'p-6',
    'px-4',
    'py-2',
    'text-white',
    'font-medium',
    'font-semibold',
    'transition-colors'
  ]
}