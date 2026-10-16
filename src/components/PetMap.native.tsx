import React, { useEffect, useRef, useState } from "react";
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
import MapView, { Marker, Polyline, Region } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { COLORS } from "@/global/themes";
import { Leitura } from "@/services/leituras";
import { PetIconBySpecies } from "@/components/PetIcons";

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
  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList>(null);
  const [localizacaoUsuario, setLocalizacaoUsuario] =
    useState<Location.LocationObjectCoords | null>(null);
  const [obtendoLocal, setObtendoLocal] = useState(false);
  const [recolhido, setRecolhido] = useState(false);
  const [itemAtivoManual, setItemAtivoManual] = useState<Leitura | null>(null);
  const itemAtivo =
    leituraSelecionada ??
    itemAtivoManual ??
    (leituras.length > 0 ? leituras[0] : null);

  // Região inicial padrão
  const defaultRegion: Region = {
    latitude: leituras.length > 0 ? leituras[0].latitude : -10.1843,
    longitude: leituras.length > 0 ? leituras[0].longitude : -48.3336,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  };

  useEffect(() => {
    if (leituraSelecionada) {
      centralizarEmLeitura(leituraSelecionada);
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

  // Centraliza o mapa em uma leitura específica
  function centralizarEmLeitura(leitura: Leitura) {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: leitura.latitude,
          longitude: leitura.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        },
        800
      );
    }
  }

  // Centraliza no scan mais recente (#1)
  function centralizarNoMaisRecente() {
    if (leituras.length > 0) {
      const maisRecente = leituras[0];
      setItemAtivoManual(maisRecente);
      if (onSelecionarLeitura) onSelecionarLeitura(maisRecente);
      centralizarEmLeitura(maisRecente);
      if (listRef.current) {
        listRef.current.scrollToIndex({ index: 0, animated: true });
      }
    }
  }

  // Ajusta o zoom para enquadrar todos os pins
  function ajustarParaTodosOsPins() {
    if (leituras.length === 0 || !mapRef.current) return;

    if (leituras.length === 1) {
      centralizarEmLeitura(leituras[0]);
      return;
    }

    const coordenadas = leituras.map((l) => ({
      latitude: l.latitude,
      longitude: l.longitude,
    }));

    mapRef.current.fitToCoordinates(coordenadas, {
      edgePadding: { top: 60, right: 60, bottom: 140, left: 60 },
      animated: true,
    });
  }

  // Solicita permissão e centraliza na posição atual do usuário
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

      setLocalizacaoUsuario(local.coords);

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: local.coords.latitude,
            longitude: local.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          },
          800
        );
      }
    } catch (e) {
      console.warn("Erro ao obter localização:", e);
    } finally {
      setObtendoLocal(false);
    }
  }

  // Abre aplicativo de mapas nativo externo (Google Maps / Apple Maps / Waze)
  function abrirNoMapaExterno(leitura: Leitura) {
    const lat = leitura.latitude;
    const lng = leitura.longitude;
    const label = encodeURIComponent(
      `PetSafe: Leitura de ${leitura.pet?.nome || "Pet"}`
    );

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) =>
        console.warn("Erro ao abrir rota:", err)
      );
    }
  }

  async function compartilharLeitura(leitura: Leitura) {
    try {
      const petNome = leitura.pet?.nome || "Cachorro PetSafe";
      const texto = `📍 Localização de ${petNome}: ${
        leitura.endereco_aproximado || "Medalha escaneada"
      }. Veja no mapa: https://www.google.com/maps/search/?api=1&query=${
        leitura.latitude
      },${leitura.longitude}`;
      await Share.share({ message: texto });
    } catch {
      // Ignora erro
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

  // Coordenadas para o traçado de rota
  const coordenadasTrajeto = leituras.map((l) => ({
    latitude: l.latitude,
    longitude: l.longitude,
  }));

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={!!localizacaoUsuario}
        showsMyLocationButton={false}
      >
        {/* LINHA DE TRAJETO ENTRE ESCANEAMENTOS */}
        {mostrarTrajeto && coordenadasTrajeto.length > 1 && (
          <Polyline
            coordinates={coordenadasTrajeto}
            strokeColor={COLORS.blue}
            strokeWidth={3.5}
            lineDashPattern={[8, 6]}
          />
        )}

        {leituras.map((leitura, index) => {
          const isAtivo = itemAtivo?.id === leitura.id;
          const isLatest = index === 0;
          const numOrdem = leituras.length - index;

          return (
            <Marker
              key={leitura.id}
              coordinate={{
                latitude: leitura.latitude,
                longitude: leitura.longitude,
              }}
              onPress={() => {
                setItemAtivoManual(leitura);
                if (onSelecionarLeitura) {
                  onSelecionarLeitura(leitura);
                }
                centralizarEmLeitura(leitura);
                const idx = leituras.findIndex((l) => l.id === leitura.id);
                if (idx >= 0 && listRef.current) {
                  try {
                    listRef.current.scrollToIndex({
                      index: idx,
                      animated: true,
                    });
                  } catch {
                    // ignora
                  }
                }
              }}
            >
              <View style={styles.markerContainer}>
                {/* Badge de ordem / Mais recente */}
                <View
                  style={[
                    styles.badgePin,
                    isLatest && styles.badgePinLatest,
                    isAtivo && styles.badgePinAtivo,
                  ]}
                >
                  <Text
                    style={[
                      styles.textoBadgePin,
                      isLatest && styles.textoBadgePinLatest,
                    ]}
                  >
                    {isLatest ? "★ #1 Recente" : `#${numOrdem}`}
                  </Text>
                </View>

                {/* Pulso de radar para o ponto mais recente */}
                {isLatest && <View style={styles.radarPulseNative} />}

                <View
                  style={[
                    styles.markerIconWrapper,
                    isLatest && styles.markerIconWrapperLatest,
                    isAtivo && styles.markerIconWrapperAtivo,
                  ]}
                >
                  <PetIconBySpecies
                    especie={leitura.pet?.especie}
                    size={isAtivo ? 20 : 16}
                    fallbackColor={isLatest ? COLORS.blue : COLORS.white}
                  />
                </View>
                <View
                  style={[
                    styles.markerPonta,
                    isLatest && styles.markerPontaLatest,
                    isAtivo && styles.markerPontaAtiva,
                  ]}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* BOTÕES FLUTUANTES DE CONTROLE */}
      {mostrarControles && (
        <View style={styles.controlesFlutuantes}>
          <TouchableOpacity
            style={styles.botaoFlutuante}
            onPress={centralizarNoMaisRecente}
            accessibilityLabel="Último escaneamento"
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={22}
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
              size={22}
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
              <Ionicons name="navigate" size={20} color={COLORS.blue} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* CAROUSEL HORIZONTAL INFERIOR DE ÚLTIMOS ESCANEAMENTOS */}
      {mostrarCarousel && (
        <View style={styles.carouselContainer}>
          <TouchableOpacity
            style={styles.carouselHeader}
            onPress={() => setRecolhido(!recolhido)}
            activeOpacity={0.7}
            accessibilityLabel={
              recolhido
                ? "Expandir lista de escaneamentos"
                : "Minimizar lista de escaneamentos"
            }
          >
            <View style={styles.carouselHeaderLeft}>
              <MaterialCommunityIcons
                name="history"
                size={18}
                color={COLORS.blue}
              />
              <Text style={styles.carouselTitulo}>Últimos Escaneamentos</Text>
              <Text style={styles.carouselContador}>
                • {leituras.length}{" "}
                {leituras.length === 1 ? "registro" : "registros"}
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
              <TouchableOpacity
                style={[styles.cardScan, isAtivo && styles.cardScanAtivo]}
                onPress={() => {
                  setItemAtivoManual(item);
                  if (onSelecionarLeitura) onSelecionarLeitura(item);
                  centralizarEmLeitura(item);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.cardScanTop}>
                  <View
                    style={[
                      styles.badgeOrdemCard,
                      isLatest && styles.badgeOrdemCardLatest,
                    ]}
                  >
                    <Ionicons
                      name={isLatest ? "star" : "location"}
                      size={12}
                      color={isLatest ? COLORS.blue : COLORS.white}
                    />
                    <Text
                      style={[
                        styles.badgeOrdemCardTexto,
                        isLatest && styles.badgeOrdemCardTextoLatest,
                      ]}
                    >
                      {isLatest ? "#1 Mais Recente" : `#${numOrdem}`}
                    </Text>
                  </View>

                  <Text style={styles.tempoRelativoCard}>
                    {formatarHora(item.criado_em)}
                  </Text>
                </View>

                <View style={styles.cardScanMeio}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <PetIconBySpecies
                      especie={item.pet?.especie}
                      size={18}
                      fallbackColor={COLORS.blue}
                    />
                    <Text style={styles.petNomeCard}>
                      {item.pet?.nome || "PetSafe"}
                    </Text>
                  </View>
                  <Text style={styles.enderecoCard} numberOfLines={2}>
                    {item.endereco_aproximado ||
                      `${item.bairro || ""} ${item.cidade || ""}`.trim() ||
                      `Lat: ${item.latitude.toFixed(4)}, Long: ${item.longitude.toFixed(4)}`}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Ionicons name="time-outline" size={12} color={COLORS.roxoclaro} />
                    <Text style={styles.dataExataCard}>
                      {new Date(item.criado_em).toLocaleString("pt-BR")}
                    </Text>
                  </View>
                </View>

                {item.lido_por_dispositivo && (
                  <View style={styles.dispositivoWrapper}>
                    <Ionicons
                      name="phone-portrait-outline"
                      size={12}
                      color={COLORS.roxoclaro}
                    />
                    <Text style={styles.dispositivoTexto} numberOfLines={1}>
                      {item.lido_por_dispositivo}
                    </Text>
                  </View>
                )}

                <View style={styles.botoesAcao}>
                  <TouchableOpacity
                    style={styles.botaoRota}
                    onPress={() => abrirNoMapaExterno(item)}
                  >
                    <Ionicons name="navigate" size={14} color={COLORS.blue} />
                    <Text style={styles.textoBotaoRota}>Traçar Rota</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botaoCompartilhar}
                    onPress={() => compartilharLeitura(item)}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={14}
                      color={COLORS.blue}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
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
  },
  map: {
    flex: 1,
    width: "100%",
  },

  // Marcador customizado
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  badgePin: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: -4,
    zIndex: 2,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  badgePinLatest: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.blue,
  },
  badgePinAtivo: {
    transform: [{ scale: 1.1 }],
  },
  textoBadgePin: {
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
    color: COLORS.white,
  },
  textoBadgePinLatest: {
    color: COLORS.blue,
  },
  radarPulseNative: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 177, 1, 0.45)",
    top: 10,
    zIndex: -1,
  },
  markerIconWrapper: {
    backgroundColor: COLORS.blue,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerIconWrapperLatest: {
    backgroundColor: COLORS.yellow,
    borderColor: COLORS.blue,
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  markerIconWrapperAtivo: {
    borderColor: COLORS.yellow,
    transform: [{ scale: 1.2 }],
    shadowOpacity: 0.45,
  },
  markerPonta: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderStyle: "solid",
    backgroundColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: COLORS.blue,
    marginTop: -1,
  },
  markerPontaLatest: {
    borderTopColor: COLORS.yellow,
    borderTopWidth: 9,
  },
  markerPontaAtiva: {
    borderTopColor: COLORS.yellow,
    borderTopWidth: 10,
  },

  // Controles flutuantes
  controlesFlutuantes: {
    position: "absolute",
    right: 14,
    top: 14,
    gap: 10,
  },
  botaoFlutuante: {
    backgroundColor: COLORS.white,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },

  // Carousel Inferior
  carouselContainer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    paddingTop: 10,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
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
  badgeOrdemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeOrdemCardLatest: {
    backgroundColor: COLORS.yellow,
  },
  badgeOrdemCardTexto: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: COLORS.white,
  },
  badgeOrdemCardTextoLatest: {
    color: COLORS.blue,
  },
  tempoRelativoCard: {
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
});
