import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS, DS } from "@/global/themes";
import { Leitura } from "@/services/leituras";
import {
  CAT_SVG_STRING,
  DOG_SVG_STRING,
  PetIconBySpecies,
} from "@/components/PetIcons";
import { CardBadgeContainer, TiltCard } from "@/components/ds";
import { generateLeafletHtml } from "./leafletHtml";

export type PetMapProps = {
  leituras: Leitura[];
  leituraSelecionada?: Leitura | null;
  onSelecionarLeitura?: (leitura: Leitura) => void;
  mostrarTrajeto?: boolean;
  style?: object;
  mostrarControles?: boolean;
  mostrarCarousel?: boolean;
};

export default function PetMapWeb({
  leituras,
  leituraSelecionada,
  onSelecionarLeitura,
  mostrarTrajeto = true,
  style,
  mostrarControles = true,
  mostrarCarousel = true,
}: PetMapProps) {
  const iframeRef = useRef<any>(null);
  const listRef = useRef<FlatList>(null);
  const [itemAtivoManual, setItemAtivoManual] = useState<Leitura | null>(null);
  const itemAtivo =
    leituraSelecionada ??
    itemAtivoManual ??
    (leituras.length > 0 ? leituras[0] : null);

  const [tipoVisualizacao, setTipoVisualizacao] = useState<"padrao" | "satelite">(
    "padrao"
  );
  const [obtendoLocal, setObtendoLocal] = useState(false);
  const [recolhido, setRecolhido] = useState(false);

  // Sincroniza quando leituraSelecionada mudar externamente
  useEffect(() => {
    if (leituraSelecionada) {
      enviarComandoParaMapa("SELECT_SCAN", {
        id: leituraSelecionada.id,
        lat: leituraSelecionada.latitude,
        lng: leituraSelecionada.longitude,
      });
      // Rola a lista horizontal para o item ativo
      const idx = leituras.findIndex((l) => l.id === leituraSelecionada.id);
      if (idx >= 0 && listRef.current) {
        try {
          listRef.current.scrollToIndex({ index: idx, animated: true });
        } catch {
          // ignora caso lista não esteja pronta
        }
      }
    }
  }, [leituraSelecionada, leituras]);

  // Escuta mensagens vindas do mapa (Leaflet dentro do iframe)
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || typeof event.data !== "object") return;

      if (event.data.type === "MARKER_CLICKED") {
        const id = event.data.id;
        const encontrada = leituras.find((l) => l.id === id);
        if (encontrada) {
          setItemAtivoManual(encontrada);
          if (onSelecionarLeitura) onSelecionarLeitura(encontrada);
          const idx = leituras.findIndex((l) => l.id === id);
          if (idx >= 0 && listRef.current) {
            try {
              listRef.current.scrollToIndex({ index: idx, animated: true });
            } catch {
              // ignora
            }
          }
        }
      }
    }

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("message", handleMessage);
      return () => {
        window.removeEventListener("message", handleMessage);
      };
    }
  }, [leituras, onSelecionarLeitura]);

  function enviarComandoParaMapa(type: string, payload?: any) {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type, ...payload },
        "*"
      );
    }
  }

  // Gera o HTML autônomo com Leaflet, OpenStreetMap, marcadores customizados e linha de trajeto
  const leafletHtml = useMemo(() => {
    return generateLeafletHtml({
      leituras,
      activeId: itemAtivo?.id || (leituras[0]?.id ?? ""),
      mostrarTrajeto,
    });
  }, [leituras, itemAtivo?.id, mostrarTrajeto]);

  function selecionarLeitura(leitura: Leitura) {
    setItemAtivoManual(leitura);
    if (onSelecionarLeitura) onSelecionarLeitura(leitura);
    enviarComandoParaMapa("SELECT_SCAN", {
      id: leitura.id,
      lat: leitura.latitude,
      lng: leitura.longitude,
    });
  }

  function centralizarNoMaisRecente() {
    if (leituras.length > 0) {
      selecionarLeitura(leituras[0]);
      enviarComandoParaMapa("CENTER_LATEST");
    }
  }

  function ajustarParaTodosOsPontos() {
    enviarComandoParaMapa("FIT_ALL");
  }

  function alternarCamada() {
    const nova = tipoVisualizacao === "padrao" ? "satelite" : "padrao";
    setTipoVisualizacao(nova);
    enviarComandoParaMapa("SET_LAYER", { layer: nova });
  }

  function obterMinhaLocalizacao() {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      setObtendoLocal(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setObtendoLocal(false);
          enviarComandoParaMapa("USER_LOCATION", {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          setObtendoLocal(false);
          console.warn("Erro ao obter geolocalização web:", err);
          alert("Não foi possível acessar a localização do navegador.");
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert("Geolocalização não disponível no navegador.");
    }
  }

  function abrirRota(leitura: Leitura) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${leitura.latitude},${leitura.longitude}`;
    Linking.openURL(url);
  }

  async function compartilharLeitura(leitura: Leitura) {
    try {
      const petNome = leitura.pet?.nome || "Cachorro PetSafe";
      const texto = `📍 Localização de ${petNome}: ${leitura.endereco_aproximado || "Medalha escaneada"}. Veja no mapa: https://www.google.com/maps/search/?api=1&query=${leitura.latitude},${leitura.longitude}`;
      await Share.share({ message: texto });
    } catch {
      // Ignora erro de compartilhamento cancelado
    }
  }

  function formatarHora(isoString: string) {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  return (
    <View style={[styles.container, style]}>
      {/* MAPA INTERATIVO (IFRAME LEAFLET) */}
      <View style={styles.iframeWrapper}>
        {React.createElement("iframe", {
          ref: iframeRef,
          srcDoc: leafletHtml,
          style: {
            width: "100%",
            height: "100%",
            border: "none",
            backgroundColor: "#E5E7EB",
          },
          title: "Mapa Interativo de Leituras do Pet",
        })}

        {/* CONTROLES FLUTUANTES SOBRE O MAPA */}
        {mostrarControles && (
          <View style={styles.controlesFlutuantes}>
            <TouchableOpacity
              style={styles.botaoControle}
              onPress={centralizarNoMaisRecente}
              accessibilityLabel="Focar no mais recente"
            >
              <MaterialCommunityIcons
                name="crosshairs-gps"
                size={20}
                color={COLORS.yellow}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoControle}
              onPress={ajustarParaTodosOsPontos}
              accessibilityLabel="Ver todos os pontos"
            >
              <MaterialCommunityIcons
                name="image-filter-center-focus"
                size={20}
                color={COLORS.blue}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoControle}
              onPress={obterMinhaLocalizacao}
              disabled={obtendoLocal}
              accessibilityLabel="Minha localização"
            >
              {obtendoLocal ? (
                <ActivityIndicator size="small" color={COLORS.blue} />
              ) : (
                <Ionicons name="navigate" size={18} color={COLORS.blue} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.botaoControle,
                tipoVisualizacao === "satelite" && styles.botaoControleAtivo,
              ]}
              onPress={alternarCamada}
              accessibilityLabel="Alternar satélite / rua"
            >
              <Ionicons
                name="layers-outline"
                size={18}
                color={
                  tipoVisualizacao === "satelite" ? COLORS.white : COLORS.blue
                }
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* CAROUSEL HORIZONTAL DOS ÚLTIMOS ESCANEAMENTOS */}
      {mostrarCarousel && (
        <View style={styles.carouselContainer}>
          <TouchableOpacity
            style={styles.carouselHeader}
            onPress={() => setRecolhido(!recolhido)}
            activeOpacity={0.7}
            accessibilityLabel={recolhido ? "Expandir lista de escaneamentos" : "Minimizar lista de escaneamentos"}
          >
            <View style={styles.carouselHeaderLeft}>
              <MaterialCommunityIcons name="history" size={18} color={COLORS.blue} />
              <Text style={styles.carouselTitulo}>Últimos Escaneamentos</Text>
              <Text style={styles.carouselContador}>
                • {leituras.length} {leituras.length === 1 ? "registro" : "registros"}
              </Text>
            </View>
            <View style={styles.botaoToggleRecolhido}>
              <Text style={styles.textoToggleRecolhido}>
                {recolhido ? "Ver Lista" : "Minimizar"}
              </Text>
              <Ionicons
                name={recolhido ? "chevron-up" : "chevron-down"}
                size={16}
                color={COLORS.blue}
              />
            </View>
          </TouchableOpacity>

          {!recolhido && (
            <FlatList
              ref={listRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={leituras}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.carouselLista}
              renderItem={({ item, index }) => {
                const isAtivo = itemAtivo?.id === item.id;
                const isLatest = index === 0;
                const numOrdem = leituras.length - index;

                return (
                  <TiltCard
                    variant={isAtivo ? "gradient" : "surface"}
                    onPress={() => selecionarLeitura(item)}
                    style={{ width: 250 }}
                    contentStyle={[
                      styles.cardScanInner,
                      !isAtivo && styles.cardScanInactive,
                    ]}
                    padding={12}
                    accessibilityLabel={`Escaneamento #${numOrdem} de ${item.pet?.nome || "PetSafe"}`}
                  >
                    <View style={styles.cardScanTop}>
                      <View
                        style={[
                          styles.badgeOrdem,
                          isAtivo
                            ? styles.badgeOrdemAtivoAAA
                            : isLatest
                            ? styles.badgeOrdemLatest
                            : styles.badgeOrdemNormal,
                        ]}
                      >
                        <Ionicons
                          name={isLatest ? "star" : "location"}
                          size={12}
                          color={isAtivo ? "#FFFFFF" : isLatest ? COLORS.blue : COLORS.white}
                        />
                        <Text
                          style={[
                            styles.badgeOrdemTexto,
                            isAtivo
                              ? styles.badgeOrdemTextoAAA
                              : isLatest
                              ? styles.badgeOrdemTextoLatest
                              : null,
                          ]}
                        >
                          {isLatest ? "#1 Mais Recente" : `#${numOrdem}`}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.tempoRelativo,
                          isAtivo && styles.tempoRelativoAAA,
                        ]}
                      >
                        {formatarHora(item.criado_em)}
                      </Text>
                    </View>

                    <View style={styles.cardScanMeio}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        {isAtivo ? (
                          <CardBadgeContainer style={styles.miniIconBadge}>
                            <PetIconBySpecies
                              especie={item.pet?.especie}
                              size={16}
                              fallbackColor="#FFFFFF"
                            />
                          </CardBadgeContainer>
                        ) : (
                          <PetIconBySpecies
                            especie={item.pet?.especie}
                            size={18}
                            fallbackColor={COLORS.blue}
                          />
                        )}
                        <Text
                          style={[
                            styles.petNomeCard,
                            isAtivo && styles.petNomeCardAAA,
                          ]}
                        >
                          {item.pet?.nome || "PetSafe"}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.enderecoCard,
                          isAtivo && styles.enderecoCardAAA,
                        ]}
                        numberOfLines={2}
                      >
                        {item.endereco_aproximado ||
                          `${item.bairro || ""} Palmas`.trim()}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={isAtivo ? "rgba(255, 255, 255, 0.88)" : COLORS.roxoclaro}
                        />
                        <Text
                          style={[
                            styles.dataExataCard,
                            isAtivo && styles.dataExataCardAAA,
                          ]}
                        >
                          {new Date(item.criado_em).toLocaleString("pt-BR")}
                        </Text>
                      </View>
                    </View>

                    {item.lido_por_dispositivo && (
                      <View
                        style={[
                          styles.dispositivoWrapper,
                          isAtivo && styles.dispositivoWrapperAAA,
                        ]}
                      >
                        <Ionicons
                          name="phone-portrait-outline"
                          size={12}
                          color={isAtivo ? "rgba(255, 255, 255, 0.88)" : COLORS.roxoclaro}
                        />
                        <Text
                          style={[
                            styles.dispositivoTexto,
                            isAtivo && styles.dispositivoTextoAAA,
                          ]}
                          numberOfLines={1}
                        >
                          {item.lido_por_dispositivo}
                        </Text>
                      </View>
                    )}

                    <View style={styles.botoesAcao}>
                      <TouchableOpacity
                        style={[styles.botaoRota, isAtivo && styles.botaoRotaAAA]}
                        onPress={() => abrirRota(item)}
                      >
                        <Ionicons name="navigate" size={14} color={COLORS.blue} />
                        <Text style={styles.textoBotaoRota}>Traçar Rota</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.botaoCompartilhar, isAtivo && styles.botaoCompartilharAAA]}
                        onPress={() => compartilharLeitura(item)}
                      >
                        <Ionicons
                          name="share-social-outline"
                          size={14}
                          color={COLORS.blue}
                        />
                      </TouchableOpacity>
                    </View>
                  </TiltCard>
                );
              }}
        />
          )}
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  iframeWrapper: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  controlesFlutuantes: {
    position: "absolute",
    right: 14,
    top: 14,
    gap: 8,
    zIndex: 10,
  },
  botaoControle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  botaoControleAtivo: {
    backgroundColor: COLORS.blue,
  },

  // Carousel Inferior
  carouselContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    paddingBottom: 14,
  },
  carouselHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  carouselHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  carouselTitulo: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  carouselContador: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  botaoToggleRecolhido: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F2FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  textoToggleRecolhido: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  carouselLista: {
    paddingHorizontal: 14,
    gap: 10,
  },
  cardScan: {
    width: 250,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  cardScanAtivo: {
    backgroundColor: "#FFFFFF",
    borderColor: COLORS.yellow,
    shadowColor: COLORS.yellow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cardScanTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeOrdem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeOrdemLatest: {
    backgroundColor: COLORS.yellow,
  },
  badgeOrdemAtivo: {
    transform: [{ scale: 1.05 }],
  },
  badgeOrdemTexto: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: COLORS.white,
  },
  badgeOrdemTextoLatest: {
    color: COLORS.blue,
  },
  tempoRelativo: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.yellow,
  },
  cardScanMeio: {
    gap: 2,
  },
  petNomeCard: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  enderecoCard: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#374151",
    lineHeight: 16,
  },
  dataExataCard: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
    marginTop: 2,
  },
  dispositivoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dispositivoTexto: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
    flex: 1,
  },
  botoesAcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  botaoRota: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    paddingVertical: 6,
    borderRadius: 8,
  },
  textoBotaoRota: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  botaoCompartilhar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardScanInner: {
    borderRadius: 14,
    gap: 8,
  },
  cardScanInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  badgeOrdemNormal: {
    backgroundColor: COLORS.blue,
  },
  badgeOrdemAtivoAAA: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  badgeOrdemTextoAAA: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
  },
  tempoRelativoAAA: {
    color: "#F1F5F9",
    fontFamily: "Poppins_600SemiBold",
  },
  miniIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  petNomeCardAAA: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
  },
  enderecoCardAAA: {
    color: "rgba(255, 255, 255, 0.92)",
    fontFamily: "Poppins_500Medium",
  },
  dataExataCardAAA: {
    color: "#F1F5F9",
    fontFamily: "Poppins_400Regular",
  },
  dispositivoWrapperAAA: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  dispositivoTextoAAA: {
    color: "#FFFFFF",
  },
  botaoRotaAAA: {
    backgroundColor: "#FFFFFF",
  },
  botaoCompartilharAAA: {
    backgroundColor: "#FFFFFF",
  },
});
