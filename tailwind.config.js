/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Valley Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Valley Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
      },
      height: {
        screen: '100dvh',
      },
      minHeight: {
        screen: '100dvh',
      },
      colors: {
        // Tokens semánticos — usan las CSS variables de index.css
        bg:       'rgb(var(--color-bg) / <alpha-value>)',
        surface:  'rgb(var(--color-surface) / <alpha-value>)',
        surface2: 'rgb(var(--color-surface-2) / <alpha-value>)',
        border:   'rgb(var(--color-border) / <alpha-value>)',
        text:     'rgb(var(--color-text) / <alpha-value>)',
        muted:    'rgb(var(--color-text-muted) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
          hover:   'rgb(var(--color-primary-hover) / <alpha-value>)',
          soft:    'rgb(var(--color-primary-soft) / <alpha-value>)',
          text:    'rgb(var(--color-primary-text) / <alpha-value>)',
        },
        danger:  'rgb(var(--color-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info:    'rgb(var(--color-info) / <alpha-value>)',
        accent:  'rgb(var(--color-purple) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
