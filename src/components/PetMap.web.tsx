import React, { useState } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/global/themes";
import { Leitura } from "@/services/leituras";

export type PetMapProps = {
  leituras: Leitura[];
  leituraSelecionada?: Leitura | null;
  onSelecionarLeitura?: (leitura: Leitura) => void;
  style?: object;
  mostrarControles?: boolean;
};

export default function PetMapWeb({
  leituras,
  leituraSelecionada,
  onSelecionarLeitura,
  style,
}: PetMapProps) {
  const [itemAtivo, setItemAtivo] = useState<Leitura | null>(
    leituraSelecionada || (leituras.length > 0 ? leituras[0] : null)
  );

  function abrirNoGoogleMaps(leitura: Leitura) {
    const url = `https://www.google.com/maps/search/?api=1&query=${leitura.latitude},${leitura.longitude}`;
    Linking.openURL(url);
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
      {/* Banner de visualização web */}
      <View style={styles.webHeader}>
        <Ionicons name="map" size={24} color={COLORS.blue} />
        <View style={{ flex: 1 }}>
          <Text style={styles.webTitle}>Pontos de Leitura no Mapa</Text>
          <Text style={styles.webSubtitle}>
            Visualização simplificada para navegadores web
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.listaContainer}>
        {leituras.map((leitura) => {
          const isAtivo = itemAtivo?.id === leitura.id;

          return (
            <TouchableOpacity
              key={leitura.id}
              style={[styles.cardItem, isAtivo && styles.cardItemAtivo]}
              onPress={() => {
                setItemAtivo(leitura);
                if (onSelecionarLeitura) onSelecionarLeitura(leitura);
              }}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.pinIcone,
                    isAtivo && { backgroundColor: COLORS.yellow },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="paw"
                    size={18}
                    color={COLORS.white}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardPetNome}>
                    {leitura.pet?.nome || "Medalha Pet"}
                  </Text>
                  <Text style={styles.cardData}>
                    {formatarData(leitura.criado_em)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.botaoAbrirMaps}
                  onPress={() => abrirNoGoogleMaps(leitura)}
                >
                  <Ionicons name="open-outline" size={16} color={COLORS.blue} />
                  <Text style={styles.textoBotaoMaps}>Google Maps</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cardDetalhes}>
                <Ionicons name="location" size={16} color={COLORS.yellow} />
                <Text style={styles.cardEndereco}>
                  {leitura.endereco_aproximado ||
                    `${leitura.bairro || ""} ${leitura.cidade || ""}`.trim() ||
                    `Lat: ${leitura.latitude.toFixed(4)}, Lng: ${leitura.longitude.toFixed(4)}`}
                </Text>
              </View>

              {leitura.lido_por_dispositivo && (
                <Text style={styles.cardDispositivo}>
                  Dispositivo: {leitura.lido_por_dispositivo}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    overflow: "hidden",
  },
  webHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  webTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  webSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  listaContainer: {
    padding: 16,
    gap: 12,
  },
  cardItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  cardItemAtivo: {
    borderColor: COLORS.blue,
    backgroundColor: "#F5F7FF",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  pinIcone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  cardPetNome: {
    fontSize: 15,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  cardData: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  botaoAbrirMaps: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#EEF2FF",
    borderRadius: 6,
  },
  textoBotaoMaps: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  cardDetalhes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardEndereco: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#374151",
    flex: 1,
  },
  cardDispositivo: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: COLORS.placeholder,
    marginLeft: 22,
  },
});
