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
    label: "Dark romântico",
    description: "Rosa, roxo e brilho cinematográfico em fundo escuro.",
    swatches: ["#07050f", "#ec4899", "#8b5cf6"]
  },
  "floral-light": {
    label: "Claro floral",
    description: "Luz suave, flores e tons rosados com contraste delicado.",
    swatches: ["#fff7fb", "#f472b6", "#7c3aed"]
  },
  minimal: {
    label: "Minimalista",
    description: "Composição limpa, contraste elegante e foco na mensagem.",
    swatches: ["#111827", "#f9fafb", "#ec4899"]
  }
};
