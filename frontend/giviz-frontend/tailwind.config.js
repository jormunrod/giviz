/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        givizBackground: "#F5F5F7",
        givizBlack: "#111827",
        givizBlue1: "#DDF5F7",
        givizBlue2: "#C0D9E5",
        givizBlue3: "#44679F",
        givizBlue4: "#3B577D",
      },
      fontFamily: {
        sans: ["Kufam", "sans-serif"],
        inter: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
      },
    },
  },
  plugins: [],
};
