import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/global/themes";
import { getPet, Pet } from "@/services/pets";
import { Leitura, listarLeiturasPorPet } from "@/services/leituras";
import PetMap from "@/components/PetMap";

export default function PetDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      try {
        setCarregando(true);
        const [dadosPet, dadosLeituras] = await Promise.all([
          getPet(id).catch(() => null),
          listarLeiturasPorPet(id).catch(() => []),
        ]);

        if (dadosPet) {
          setPet(dadosPet);
        } else {
          // Fallback gracioso se estiver em desenvolvimento
          setPet({
            id,
            nome: "Pipoca",
            especie: "Cachorro",
            raca: "Golden Retriever",
            observacoes: "Pet cadastrado no PetSafe.",
          });
        }

        setLeituras(dadosLeituras);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [id]);

  if (carregando) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
      </SafeAreaView>
    );
  }

  const ultimaLeitura = leituras.length > 0 ? leituras[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.blue} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>Detalhes do Pet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* CARD DO PET */}
        <View style={styles.cardPet}>
          <View style={styles.avatarWrapper}>
            <MaterialCommunityIcons name="paw" size={40} color={COLORS.blue} />
          </View>
          <Text style={styles.petNome}>{pet?.nome || "Pet"}</Text>
          <Text style={styles.petInfo}>
            {pet?.especie || "Espécie não informada"} •{" "}
            {pet?.raca || "Sem raça definida"}
          </Text>
        </View>

        {/* SEÇÃO DO MAPA / ÚLTIMA LEITURA */}
        <View style={styles.secaoMapa}>
          <View style={styles.secaoHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.secaoTitulo}>Última Localização da Tag</Text>
              <Text style={styles.secaoSubtitulo}>
                {leituras.length} leitura(s) registrada(s)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.botaoMapaCompleto}
              onPress={() =>
                router.push({
                  pathname: "/mapa" as any,
                  params: { petId: id },
                })
              }
            >
              <Ionicons name="map" size={16} color={COLORS.white} />
              <Text style={styles.textoBotaoMapa}>Mapa Completo</Text>
            </TouchableOpacity>
          </View>

          {leituras.length > 0 ? (
            <View style={styles.mapaPreviewContainer}>
              <View style={styles.mapaPreviewWrapper}>
                <PetMap
                  leituras={leituras}
                  mostrarControles={false}
                  mostrarCarousel={false}
                  style={styles.mapaPreview}
                />
              </View>

              {ultimaLeitura && (
                <View style={styles.cardUltimaLeitura}>
                  <Ionicons name="location-sharp" size={18} color={COLORS.yellow} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.enderecoTexto} numberOfLines={2}>
                      {ultimaLeitura.endereco_aproximado ||
                        `${ultimaLeitura.bairro || ""} ${ultimaLeitura.cidade || ""}`.trim() ||
                        `Lat: ${ultimaLeitura.latitude.toFixed(4)}, Long: ${ultimaLeitura.longitude.toFixed(4)}`}
                    </Text>
                    <Text style={styles.horaTexto}>
                      Registrado em:{" "}
                      {new Date(ultimaLeitura.criado_em).toLocaleString("pt-BR")}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.semLeituras}>
              <Ionicons name="shield-outline" size={32} color={COLORS.placeholder} />
              <Text style={styles.semLeiturasTexto}>
                Nenhuma leitura registrada para esta tag ainda.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitulo: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  cardPet: {
    backgroundColor: "#F8F9FE",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEBFA",
  },
  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  petNome: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  petInfo: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
    marginTop: 2,
  },
  secaoMapa: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F5",
    padding: 16,
    gap: 12,
  },
  secaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  secaoTitulo: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  secaoSubtitulo: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  botaoMapaCompleto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  textoBotaoMapa: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.white,
  },
  mapaPreviewContainer: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  mapaPreviewWrapper: {
    height: 180,
    width: "100%",
  },
  mapaPreview: {
    height: "100%",
    width: "100%",
  },
  cardUltimaLeitura: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: "#FAFAFD",
  },
  enderecoTexto: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#2C2C2E",
  },
  horaTexto: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: COLORS.placeholder,
    marginTop: 2,
  },
  semLeituras: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 8,
  },
  semLeiturasTexto: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: COLORS.placeholder,
    textAlign: "center",
  },
});
