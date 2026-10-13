import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";

import { COLORS } from "@/global/themes";
import { Leitura } from "@/services/leituras";

export type PetMapProps = {
  leituras: Leitura[];
  leituraSelecionada?: Leitura | null;
  onSelecionarLeitura?: (leitura: Leitura) => void;
  style?: object;
  mostrarControles?: boolean;
};

export default function PetMap({
  leituras,
  leituraSelecionada,
  onSelecionarLeitura,
  style,
  mostrarControles = true,
}: PetMapProps) {
  const mapRef = useRef<MapView>(null);
  const [localizacaoUsuario, setLocalizacaoUsuario] =
    useState<Location.LocationObjectCoords | null>(null);
  const [obtendoLocal, setObtendoLocal] = useState(false);
  const [itemAtivo, setItemAtivo] = useState<Leitura | null>(
    leituraSelecionada || (leituras.length > 0 ? leituras[0] : null)
  );

  // Região inicial padrão (Palmas - TO, sede da UFT ou ponto do pet)
  const defaultRegion: Region = {
    latitude:
      leituras.length > 0 ? leituras[0].latitude : -10.1843,
    longitude:
      leituras.length > 0 ? leituras[0].longitude : -48.3336,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  useEffect(() => {
    if (leituraSelecionada) {
      Promise.resolve().then(() => {
        setItemAtivo(leituraSelecionada);
        centralizarEmLeitura(leituraSelecionada);
      });
    }
  }, [leituraSelecionada]);

  // Centraliza o mapa em uma leitura específica
  function centralizarEmLeitura(leitura: Leitura) {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: leitura.latitude,
          longitude: leitura.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        800
      );
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
      edgePadding: { top: 60, right: 60, bottom: 120, left: 60 },
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
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) =>
        console.warn("Erro ao abrir rota:", err)
      );
    }
  }

  function formatarData(dataStr: string) {
    try {
      const data = new Date(dataStr);
      return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dataStr;
    }
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={defaultRegion}
        showsUserLocation={!!localizacaoUsuario}
        showsMyLocationButton={false}
      >
        {leituras.map((leitura) => {
          const isAtivo = itemAtivo?.id === leitura.id;

          return (
            <Marker
              key={leitura.id}
              coordinate={{
                latitude: leitura.latitude,
                longitude: leitura.longitude,
              }}
              onPress={() => {
                setItemAtivo(leitura);
                if (onSelecionarLeitura) {
                  onSelecionarLeitura(leitura);
                }
                centralizarEmLeitura(leitura);
              }}
            >
              <View
                style={[
                  styles.markerContainer,
                  isAtivo && styles.markerContainerAtivo,
                ]}
              >
                <View
                  style={[
                    styles.markerIconWrapper,
                    isAtivo && styles.markerIconWrapperAtivo,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="paw"
                    size={isAtivo ? 20 : 16}
                    color={COLORS.white}
                  />
                </View>
                <View
                  style={[
                    styles.markerPonta,
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
            onPress={irParaMinhaLocalizacao}
            disabled={obtendoLocal}
            accessibilityLabel="Minha localização"
          >
            {obtendoLocal ? (
              <ActivityIndicator size="small" color={COLORS.blue} />
            ) : (
              <Ionicons name="locate" size={22} color={COLORS.blue} />
            )}
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
        </View>
      )}

      {/* CARD FLUTUANTE DA LEITURA SELECIONADA */}
      {itemAtivo && (
        <View style={styles.cardInfo}>
          <View style={styles.cardHeader}>
            <View style={styles.tagIcone}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.white} />
            </View>
            <View style={styles.cardTituloContainer}>
              <Text style={styles.cardPetNome}>
                {itemAtivo.pet?.nome || "Medalha PetSafe"}
              </Text>
              <Text style={styles.cardData}>
                {formatarData(itemAtivo.criado_em)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => abrirNoMapaExterno(itemAtivo)}
              style={styles.botaoRota}
            >
              <Ionicons name="navigate" size={16} color={COLORS.blue} />
              <Text style={styles.textoBotaoRota}>Rota</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivisor} />

          <View style={styles.cardDetalhes}>
            <Ionicons name="location-sharp" size={16} color={COLORS.yellow} />
            <Text style={styles.cardEndereco} numberOfLines={2}>
              {itemAtivo.endereco_aproximado ||
                `${itemAtivo.bairro || ""} ${itemAtivo.cidade || ""}`.trim() ||
                `Lat: ${itemAtivo.latitude.toFixed(4)}, Long: ${itemAtivo.longitude.toFixed(4)}`}
            </Text>
          </View>

          {itemAtivo.lido_por_dispositivo && (
            <View style={styles.cardSubdetalhe}>
              <Ionicons name="phone-portrait-outline" size={13} color={COLORS.roxoclaro} />
              <Text style={styles.cardDispositivo}>
                Lido por: {itemAtivo.lido_por_dispositivo}
              </Text>
            </View>
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
    width: "100%",
    height: "100%",
  },

  // Marcador customizado
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerContainerAtivo: {
    transform: [{ scale: 1.15 }],
  },
  markerIconWrapper: {
    backgroundColor: COLORS.blue,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerIconWrapperAtivo: {
    backgroundColor: COLORS.yellow,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: COLORS.blue,
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
  markerPontaAtiva: {
    borderTopColor: COLORS.yellow,
    borderTopWidth: 10,
  },

  // Controles flutuantes
  controlesFlutuantes: {
    position: "absolute",
    right: 16,
    top: 16,
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
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },

  // Card inferior de informações
  cardInfo: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F0F0F5",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagIcone: {
    backgroundColor: COLORS.blue,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTituloContainer: {
    flex: 1,
  },
  cardPetNome: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  cardData: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  botaoRota: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  textoBotaoRota: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  cardDivisor: {
    height: 1,
    backgroundColor: "#F0F0F5",
    marginVertical: 10,
  },
  cardDetalhes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardEndereco: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#2C2C2E",
  },
  cardSubdetalhe: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  cardDispositivo: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: COLORS.placeholder,
  },
});
