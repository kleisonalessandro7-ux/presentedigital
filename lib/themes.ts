import type { GiftTheme } from "@/lib/types";

export const giftThemes: Record<
  GiftTheme,
  {
    label: string;
    description: string;
    swatches: string[];
  }
> = {
  "romantic-dark": {
    label: "Dark romantico",
    description: "Rosa, roxo e brilho cinematografico em fundo escuro.",
    swatches: ["#07050f", "#ec4899", "#8b5cf6"]
  },
  "floral-light": {
    label: "Claro floral",
    description: "Luz suave, flores e tons rosados com contraste delicado.",
    swatches: ["#fff7fb", "#f472b6", "#7c3aed"]
  },
  minimal: {
    label: "Minimalista",
    description: "Composicao limpa, contraste elegante e foco na mensagem.",
    swatches: ["#111827", "#f9fafb", "#ec4899"]
  },
  "cinema-night": {
    label: "Cinema romantico",
    description: "Luzes de filme, contraste alto e clima de cena final.",
    swatches: ["#05020a", "#e11d48", "#f59e0b"]
  },
  "starry-sky": {
    label: "Ceu estrelado",
    description: "Azul profundo, estrelas e brilho suave de constelacao.",
    swatches: ["#020617", "#38bdf8", "#f9a8d4"]
  },
  "vintage-letter": {
    label: "Carta vintage",
    description: "Papel antigo, rosa queimado e sensacao de carta guardada.",
    swatches: ["#fff7ed", "#be123c", "#92400e"]
  },
  "luxury-gold": {
    label: "Luxo dourado",
    description: "Preto elegante, dourado e detalhes de noite especial.",
    swatches: ["#030712", "#f59e0b", "#f8fafc"]
  },
  "neon-heart": {
    label: "Neon coracao",
    description: "Energia moderna, brilho neon e clima de surpresa intensa.",
    swatches: ["#09090b", "#ec4899", "#22d3ee"]
  }
};
