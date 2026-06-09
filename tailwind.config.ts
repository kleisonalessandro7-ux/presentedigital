import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        roseglow: "#ec4899",
        violetglow: "#8b5cf6",
        ink: "#07050f"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-playfair)", "Playfair Display", "serif"]
      },
      boxShadow: {
        glow: "0 0 60px rgba(236, 72, 153, 0.35)",
        violet: "0 0 70px rgba(139, 92, 246, 0.32)"
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" }
        },
        floatUp: {
          "0%": { transform: "translate3d(0, 20vh, 0) rotate(45deg)", opacity: "0" },
          "12%": { opacity: "0.75" },
          "100%": { transform: "translate3d(var(--heart-drift), -110vh, 0) rotate(45deg)", opacity: "0" }
        },
        softPulse: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.04)" }
        }
      },
      animation: {
        shimmer: "shimmer 16s ease-in-out infinite",
        softPulse: "softPulse 4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
