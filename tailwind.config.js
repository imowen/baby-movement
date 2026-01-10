/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 温馨粉色系主题
        primary: {
          50: '#fef1f7',
          100: '#fee5f0',
          200: '#fecce3',
          300: '#ffa3cb',
          400: '#ff69a9',
          500: '#fb3a8b',
          600: '#eb1a6d',
          700: '#cd0d52',
          800: '#a90f46',
          900: '#8d113d',
        },
        warm: {
          50: '#fef5f1',
          100: '#fde9e1',
          200: '#fbd5c7',
          300: '#f8b6a0',
          400: '#f38e72',
          500: '#ea6843',
          600: '#d74d29',
          700: '#b53d1f',
          800: '#96351e',
          900: '#7c3020',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
