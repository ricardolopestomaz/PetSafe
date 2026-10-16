export const COLORS = {
  roxoclaro: "#8B8BAD",
  amareloclaro: "#F3CE7B",
  yellow: "#FFB101",
  blue: "#1D1E64",
  white: "#FFFFFF",
  gray: "#EEEEEE",
  black: "#000000",
  placeholder: "#999999",
  cinzaclaro: "#D1D1D6",
};

/**
 * Design System PetSafe — Light Mode acolhedor com cards de destaque pretos.
 * Regra: fundo off-white, textos grafite, no máximo 1–2 cards pretos por tela,
 * o resto em seções abertas separadas por espaço e divisores hairline.
 */
export const DS = {
  colors: {
    // Fundo e texto no claro
    bg: "#FAF9F6",
    surface: "#FFFFFF",
    field: "#FFFFFF",
    text: "#0F172A",
    textMuted: "#64748B",
    textSubtle: "#94A3B8",
    divider: "#E2E8F0",
    border: "#E2E8F0",
    ring: "#18181B",

    // Card de destaque vivo (azul royal profundo) — texto branco, contraste padrão AAA (≥ 7:1)
    card: "#1D4ED8",
    cardGradient: ["#1D4ED8", "#1E40AF"] as [string, string],
    cardAlt: "rgba(255, 255, 255, 0.2)",
    cardBorder: "rgba(255, 255, 255, 0.28)",
    cardText: "#FFFFFF",
    cardTextMuted: "rgba(255, 255, 255, 0.92)",
    cardSubtle: "#F1F5F9",
    cardBadgeBg: "rgba(255, 255, 255, 0.2)",
    cardBadgeBorder: "rgba(255, 255, 255, 0.28)",

    // Ações principais (Índigo/Violeta vibrante e acolhedor, sem cor preta)
    primary: "#4F46E5",
    primaryGradient: ["#4F46E5", "#7C3AED"] as [string, string],
    primaryGradientHover: ["#4338CA", "#6D28D9"] as [string, string],
    primaryShadow: "#4F46E5",
    primaryText: "#FFFFFF",
    accent: COLORS.yellow,
    brand: COLORS.blue,

    // Estados
    danger: "#DC2626",
    dangerBg: "#FEF2F2",
    dangerBorder: "#FECACA",
  },
  radius: { sm: 12, md: 16, lg: 20, xl: 24 },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  font: {
    regular: "Poppins_400Regular",
    semibold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
  },
  icon: { sm: 18, md: 22 },
  hairline: 1,
};

export const themes = {
  colors: COLORS,
  ds: DS,
};
