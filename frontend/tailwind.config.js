/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: "#0E5A8A",
                secondary: "#D97706",
                accent: "#14532D"
            }
        }
    },
    plugins: []
};