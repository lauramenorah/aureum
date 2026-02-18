import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0D0E1A',
        'bg-secondary': '#13152A',
        'bg-tertiary': '#1B1E36',
        'accent-purple': '#7B5EA7',
        'accent-violet': '#9B59F5',
        'accent-teal': '#00D4AA',
        'accent-red': '#FF5B5B',
        'accent-gold': '#F5A623',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8892B0',
        'text-muted': '#4A5568',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['GeistMono', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'rgba(255,255,255,0.06)',
      },
      boxShadow: {
        'glow-purple': '0 0 40px rgba(123,94,167,0.3)',
        'glow-teal': '0 0 40px rgba(0,212,170,0.3)',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #1B1E36 0%, #0D0E1A 100%)',
        'gradient-cta': 'linear-gradient(135deg, #7B5EA7 0%, #9B59F5 100%)',
        'gradient-chart': 'linear-gradient(180deg, rgba(123,94,167,0.3) 0%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
