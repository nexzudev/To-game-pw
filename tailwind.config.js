/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bgDark: '#0a0a0f',
        indigoGlow: '#4f46e5',
        purpleGlow: '#7c3aed',
      },
      boxShadow: {
        glow: '0 0 30px rgba(124, 58, 237, 0.25)',
      },
      backgroundImage: {
        'rpg-grad': 'radial-gradient(1000px 600px at 80% -10%, rgba(79,70,229,0.25), transparent), radial-gradient(800px 500px at -10% 20%, rgba(124,58,237,0.2), transparent), linear-gradient(180deg, #0a0a0f, #0b0b12 60%)'
      }
    }
  },
  plugins: []
}
