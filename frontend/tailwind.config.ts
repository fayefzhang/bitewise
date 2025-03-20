import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        veryLightBlue: "#f5f8fc",
        lightBlue: "#C0DAFD",
        mediumBlue: "#86A3DA",
        darkBlue: "#4C6CB5",
      },
    },
  },
  plugins: [],
};
export default config;
