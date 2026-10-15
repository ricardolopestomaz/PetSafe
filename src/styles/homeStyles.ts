import { Dimensions, StyleSheet } from "react-native";
import { COLORS } from "../global/themes";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PADDING_HORIZONTAL = 24;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  conteudo: {
    flex: 1,
    paddingHorizontal: PADDING_HORIZONTAL,
  },

  titulo: {
    marginTop: 60,
    marginBottom: 10,
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#2C2C2E",
  },

  /* Banner Responsivo */
  bannerWrapper: {
    width: "100%",
    aspectRatio: 1.95,
  },

  bannerContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
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
    marginTop: 10,
    marginBottom: 10,
  },

  indicador: {
    width: 18,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cinzaclaro,
    marginHorizontal: 3,
  },

  indicadorAtivo: {
    backgroundColor: COLORS.roxoclaro,
  },

  /* Filtros com Scroll Horizontal */
  scrollWrapper: {
    marginHorizontal: -PADDING_HORIZONTAL,
  },

  containerBotoesScroll: {
    paddingHorizontal: PADDING_HORIZONTAL,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  botaoAtivo: {
    backgroundColor: COLORS.yellow,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },

  textoBotaoAtivo: {
    color: COLORS.white,
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },

  botao: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },

  textoBotao: {
    color: COLORS.cinzaclaro,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
  },

  /* Botoes de Ação acima da lista */
  headerAcoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },

  textoSecao: {
    color: COLORS.black,
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },

  adicionar: {
    padding: 5,
  },

  textoAdicionar: {
    color: COLORS.blue,
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
  },

  /* Lista de Pets */
  loading: {
    marginTop: 40,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },

  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: COLORS.placeholder,
  },

  listContent: {
    paddingBottom: 20,
  },

  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  petDetails: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.black,
    marginTop: 2,
  },

  /* Rodapé */
  rodape: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 70,
    backgroundColor: COLORS.white,
    paddingBottom: 10,
    borderTopColor: COLORS.white,
    borderTopWidth: 1,
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
