import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { COLORS } from "@/global/themes";
import { Leitura } from "@/services/leituras";
import { PetIconBySpecies } from "@/components/PetIcons";
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

export default function PetMapNative({
  leituras,
  leituraSelecionada,
  onSelecionarLeitura,
  mostrarTrajeto = true,
  style,
  mostrarControles = true,
  mostrarCarousel = true,
}: PetMapProps) {
  const webViewRef = useRef<WebView>(null);
  const listRef = useRef<FlatList>(null);
  const [obtendoLocal, setObtendoLocal] = useState(false);
  const [recolhido, setRecolhido] = useState(false);
  const [tipoVisualizacao, setTipoVisualizacao] = useState<"padrao" | "satelite">("padrao");
  const [itemAtivoManual, setItemAtivoManual] = useState<Leitura | null>(null);

  const itemAtivo =
    leituraSelecionada ??
    itemAtivoManual ??
    (leituras.length > 0 ? leituras[0] : null);

  // Sincroniza quando leituraSelecionada mudar externamente
  useEffect(() => {
    if (leituraSelecionada) {
      enviarComandoParaMapa("SELECT_SCAN", {
        id: leituraSelecionada.id,
        lat: leituraSelecionada.latitude,
        lng: leituraSelecionada.longitude,
      });
      const idx = leituras.findIndex((l) => l.id === leituraSelecionada.id);
      if (idx >= 0 && listRef.current) {
        try {
          listRef.current.scrollToIndex({ index: idx, animated: true });
        } catch {
          // ignora
        }
      }
    }
  }, [leituraSelecionada, leituras]);

  function enviarComandoParaMapa(type: string, payload?: any) {
    const payloadStr = JSON.stringify({ type, ...payload });
    webViewRef.current?.injectJavaScript(`
      (function() {
        try {
          if (typeof window.processarComando === 'function') {
            window.processarComando(${payloadStr});
          }
        } catch(e) {}
      })();
      true;
    `);
  }

  const leafletHtml = useMemo(() => {
    return generateLeafletHtml({
      leituras,
      activeId: itemAtivo?.id || (leituras[0]?.id ?? ""),
      mostrarTrajeto,
    });
  }, [leituras, itemAtivo?.id, mostrarTrajeto]);

  function selecionarLeitura(item: Leitura) {
    setItemAtivoManual(item);
    if (onSelecionarLeitura) onSelecionarLeitura(item);
    enviarComandoParaMapa("SELECT_SCAN", {
      id: item.id,
      lat: item.latitude,
      lng: item.longitude,
    });
  }

  function centralizarNoMaisRecente() {
    if (leituras.length > 0) {
      selecionarLeitura(leituras[0]);
      enviarComandoParaMapa("CENTER_LATEST");
      if (listRef.current) {
        try {
          listRef.current.scrollToIndex({ index: 0, animated: true });
        } catch {}
      }
    }
  }

  function ajustarParaTodosOsPins() {
    enviarComandoParaMapa("FIT_ALL");
  }

  async function irParaMinhaLocalizacao() {
    try {
      setObtendoLocal(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permissão de localização negada.");
        return;
      }

      const local = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      enviarComandoParaMapa("USER_LOCATION", {
        lat: local.coords.latitude,
        lng: local.coords.longitude,
      });
    } catch (e) {
      console.warn("Erro ao obter localização:", e);
    } finally {
      setObtendoLocal(false);
    }
  }

  function alternarCamada() {
    const nova = tipoVisualizacao === "padrao" ? "satelite" : "padrao";
    setTipoVisualizacao(nova);
    enviarComandoParaMapa("SET_LAYER", { layer: nova });
  }

  function abrirNoMapaExterno(leitura: Leitura) {
    const lat = leitura.latitude;
    const lng = leitura.longitude;
    const label = encodeURIComponent(leitura.pet?.nome || "PetSafe");
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
      });
  }

  async function compartilharLeitura(leitura: Leitura) {
    try {
      const petNome = leitura.pet?.nome || "meu pet";
      const dataStr = new Date(leitura.criado_em).toLocaleString("pt-BR");
      const localStr = leitura.endereco_aproximado || `${leitura.bairro || ""} Palmas`.trim();
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${leitura.latitude},${leitura.longitude}`;

      await Share.share({
        title: `Último Escaneamento de ${petNome}`,
        message: `🐾 PetSafe Alerta: A medalha inteligente de ${petNome} foi escaneada em ${dataStr} nas proximidades de ${localStr}.\n\nVeja no mapa: ${mapsUrl}`,
      });
    } catch (err) {
      console.warn("Erro ao compartilhar leitura:", err);
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
      {/* MAPA INTERATIVO (LEAFLET DENTRO DO WEBVIEW - 100% SUPORTADO NO EXPO GO) */}
      <View style={styles.mapWrapper}>
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: leafletHtml }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          geolocationEnabled={true}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === "MARKER_CLICKED") {
                const id = data.id;
                const encontrada = leituras.find((l) => l.id === id);
                if (encontrada) {
                  setItemAtivoManual(encontrada);
                  if (onSelecionarLeitura) onSelecionarLeitura(encontrada);
                  const idx = leituras.findIndex((l) => l.id === id);
                  if (idx >= 0 && listRef.current) {
                    try {
                      listRef.current.scrollToIndex({ index: idx, animated: true });
                    } catch {}
                  }
                }
              }
            } catch (_) {}
          }}
        />

        {/* CONTROLES FLUTUANTES SOBRE O MAPA */}
        {mostrarControles && (
          <View style={styles.controlesFlutuantes}>
            <TouchableOpacity
              style={styles.botaoFlutuante}
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
              style={styles.botaoFlutuante}
              onPress={ajustarParaTodosOsPins}
              accessibilityLabel="Ver todos os pontos"
            >
              <MaterialCommunityIcons
                name="image-filter-center-focus"
                size={20}
                color={COLORS.blue}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoFlutuante}
              onPress={irParaMinhaLocalizacao}
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
                styles.botaoFlutuante,
                tipoVisualizacao === "satelite" && styles.botaoFlutuanteAtivo,
              ]}
              onPress={alternarCamada}
              accessibilityLabel="Alternar satélite / rua"
            >
              <Ionicons
                name="layers-outline"
                size={18}
                color={tipoVisualizacao === "satelite" ? COLORS.white : COLORS.blue}
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
                          styles.badgeOrdemCard,
                          isAtivo
                            ? styles.badgeOrdemAtivoAAA
                            : isLatest
                            ? styles.badgeOrdemCardLatest
                            : styles.badgeOrdemCardNormal,
                        ]}
                      >
                        <Ionicons
                          name={isLatest ? "star" : "location"}
                          size={12}
                          color={isAtivo ? "#FFFFFF" : isLatest ? COLORS.blue : COLORS.white}
                        />
                        <Text
                          style={[
                            styles.badgeOrdemCardTexto,
                            isAtivo
                              ? styles.badgeOrdemTextoAAA
                              : isLatest
                              ? styles.badgeOrdemCardTextoLatest
                              : null,
                          ]}
                        >
                          {isLatest ? "#1 Mais Recente" : `#${numOrdem}`}
                        </Text>
                      </View>

                      <Text
                        style={[
                          styles.tempoRelativoCard,
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
                          `${item.bairro || ""} ${item.cidade || ""}`.trim() ||
                          `Lat: ${item.latitude.toFixed(4)}, Long: ${item.longitude.toFixed(4)}`}
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
                        onPress={() => abrirNoMapaExterno(item)}
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
    position: "relative",
    backgroundColor: "#F3F4F6",
  },
  mapWrapper: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  map: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F3F4F6",
  },

  // Controles Flutuantes
  controlesFlutuantes: {
    position: "absolute",
    right: 14,
    top: 14,
    gap: 8,
    zIndex: 10,
  },
  botaoFlutuante: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  botaoFlutuanteAtivo: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },

  // Carousel Inferior
  carouselContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
  },
  carouselHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  carouselHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  carouselTitulo: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  carouselContador: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  botaoToggleRecolhido: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  textoToggleRecolhido: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  carouselLista: {
    paddingHorizontal: 16,
    gap: 10,
  },

  // Cards de Escaneamento
  cardScanInner: {
    borderRadius: 14,
    gap: 8,
  },
  cardScanInactive: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardScanTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeOrdemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeOrdemCardNormal: {
    backgroundColor: COLORS.blue,
  },
  badgeOrdemCardLatest: {
    backgroundColor: COLORS.yellow,
  },
  badgeOrdemAtivoAAA: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  badgeOrdemCardTexto: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: COLORS.white,
  },
  badgeOrdemCardTextoLatest: {
    color: COLORS.blue,
  },
  badgeOrdemTextoAAA: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
  },
  tempoRelativoCard: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.yellow,
  },
  tempoRelativoAAA: {
    color: "#F1F5F9",
    fontFamily: "Poppins_600SemiBold",
  },
  cardScanMeio: {
    gap: 2,
  },
  miniIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  petNomeCard: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  petNomeCardAAA: {
    color: "#FFFFFF",
    fontFamily: "Poppins_700Bold",
  },
  enderecoCard: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#374151",
    lineHeight: 16,
  },
  enderecoCardAAA: {
    color: "rgba(255, 255, 255, 0.92)",
    fontFamily: "Poppins_500Medium",
  },
  dataExataCard: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
    marginTop: 2,
  },
  dataExataCardAAA: {
    color: "#F1F5F9",
    fontFamily: "Poppins_400Regular",
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
  dispositivoWrapperAAA: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  dispositivoTexto: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
    flex: 1,
  },
  dispositivoTextoAAA: {
    color: "#FFFFFF",
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
  botaoRotaAAA: {
    backgroundColor: "#FFFFFF",
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
  botaoCompartilharAAA: {
    backgroundColor: "#FFFFFF",
  },
});
