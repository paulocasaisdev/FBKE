import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bahia: {
          blue: {
            DEFAULT: "#002B7F", // Azul Cantão (Principal / Destaques corporativos)
            dark: "#001D54",    // Azul Escuro (Headers / Menus)
            light: "#EBF1FF",   // Azul Suave (Fundos de cards de ícones)
          },
          red: {
            DEFAULT: "#CE1126", // Vermelho Vitória (Botões primários e chamadas de ação)
            hover: "#A80B1C",   // Vermelho Hover
            light: "#FDF2F4",   // Vermelho Suave (Badges/Status)
          },
          gold: "#D4AF37",      // Dourado (Graduações, Medalhas e Títulos)
          bg: "#F8FAFC",        // Fundo Claro Geral (Slate 50)
          card: "#FFFFFF",      // Fundo Branco dos Cards
        },
      },
    },
  },
  plugins: [],
};

export default config;
