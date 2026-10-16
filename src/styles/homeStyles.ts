import { Dimensions, StyleSheet } from "react-native";
import { COLORS, DS } from "../global/themes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PADDING_HORIZONTAL = 24;
const C = DS.colors;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },

  conteudo: {
    flexGrow: 1,
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingBottom: 24,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },

  /* Cabeçalho com saudação e logout */
  topo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 24,
  },
  saudacaoWrapper: {
    flex: 1,
    paddingRight: 16,
  },
  saudacaoLabel: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: C.textMuted,
  },
  titulo: {
    fontSize: 26,
    fontFamily: "Poppins_700Bold",
    color: C.text,
    letterSpacing: -0.6,
  },
  botaoSair: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  botaoSairPressionado: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },

  /* Banner Responsivo */
  bannerWrapper: {
    width: "100%",
    aspectRatio: 1.95,
  },

  bannerContainer: {
    width: "100%",
    height: "100%",
    borderRadius: DS.radius.xl,
    overflow: "hidden",
    position: "relative",
  },

  imagemBanner: {
    width: "100%",
    height: "100%",
  },

  /* Texto Responsivo dentro do Banner */
  textoBanner: {
    position: "absolute",
    top: "22%",
    left: "6%",
    width: "55%",
  },

  tituloBanner: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: COLORS.white,
    lineHeight: Math.round(SCREEN_WIDTH * 0.052),
  },

  subtituloBanner: {
    marginTop: "3%",
    fontSize: Math.round(SCREEN_WIDTH * 0.03),
    fontFamily: "Poppins_400Regular",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: Math.round(SCREEN_WIDTH * 0.04),
  },

  /* Indicadores */
  indicadores: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 20,
  },

  indicador: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.divider,
    marginHorizontal: 3,
  },

  indicadorAtivo: {
    width: 18,
    backgroundColor: C.primary,
  },

  /* Filtros com Scroll Horizontal */
  scrollWrapper: {
    marginHorizontal: -PADDING_HORIZONTAL,
  },

  containerBotoesScroll: {
    paddingHorizontal: PADDING_HORIZONTAL,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  botaoAtivo: {
    backgroundColor: C.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.primary,
  },

  textoBotaoAtivo: {
    color: C.primaryText,
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  botao: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
  },

  textoBotao: {
    color: C.textMuted,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },

  /* Cabeçalho da seção */
  headerAcoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 32,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
  },

  textoSecao: {
    color: C.text,
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    letterSpacing: -0.3,
  },

  adicionar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  textoAdicionar: {
    color: C.text,
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },

  /* Loading (skeleton) */
  loading: {
    marginTop: 8,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.divider,
  },
  skeletonLines: {
    flex: 1,
    gap: 8,
  },
  skeletonLineLg: {
    height: 12,
    width: "50%",
    borderRadius: 6,
    backgroundColor: C.divider,
  },
  skeletonLineSm: {
    height: 10,
    width: "30%",
    borderRadius: 5,
    backgroundColor: C.divider,
  },

  /* Empty state */
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
    paddingBottom: 24,
  },

  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },

  emptyText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: C.textMuted,
    textAlign: "center",
  },

  listContent: {
    paddingBottom: 20,
  },

  /* Linha de pet (lista aberta, sem caixa) */
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
  },
  cardPressionado: {
    opacity: 0.6,
  },
  petAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.card,
  },
  cardInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: C.text,
  },
  petDetails: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: C.textMuted,
    marginTop: 2,
  },

  /* Rodapé */
  rodape: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    backgroundColor: C.bg,
    paddingBottom: 10,
    borderTopColor: C.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  itemRodape: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    position: "relative",
  },

  tracoAtivo: {
    position: "absolute",
    bottom: -8,
    width: 16,
    height: 3,
    backgroundColor: COLORS.yellow,
    borderRadius: 2,
  },
});
