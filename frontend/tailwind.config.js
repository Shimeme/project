/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      backgroundImage: {
        // --- YOUR CUSTOM SVG FILE ---
        'my-wood': "url('/src/assets/wood.svg')", 
        // Paper texture remains the same
        'paper-texture': "url('/src/assets/parchment.svg')",
      }
    },
  },
  plugins: [],
}
