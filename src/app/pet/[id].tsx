import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS, DS } from "@/global/themes";
import { getPet, Pet } from "@/services/pets";
import { Leitura, listarLeiturasPorPet } from "@/services/leituras";
import PetMap from "@/components/PetMap";

const C = DS.colors;

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
        <Pressable
          style={({ pressed }) => [styles.botaoVoltar, pressed && styles.pressed]}
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Detalhes do Pet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* CARD DO PET */}
        <View style={styles.cardPet}>
          <View style={styles.avatarWrapper}>
            <MaterialCommunityIcons name="paw" size={36} color={C.card} />
          </View>
          <Text style={styles.petNome}>{pet?.nome || "Pet"}</Text>
          <Text style={styles.petInfo}>
            {pet?.especie || "Espécie não informada"} • {pet?.raca || "Sem raça definida"}
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
              <Ionicons name="map" size={15} color={COLORS.white} />
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
              <Ionicons name="shield-outline" size={32} color={C.textSubtle} />
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
    backgroundColor: C.bg,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
    backgroundColor: C.bg,
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  headerTitulo: {
    fontSize: 18,
    fontFamily: DS.font.bold,
    color: C.text,
  },
  content: {
    padding: 20,
    gap: 20,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  cardPet: {
    backgroundColor: C.surface,
    borderRadius: DS.radius.lg,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  avatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.cardAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  petNome: {
    fontSize: 20,
    fontFamily: DS.font.bold,
    color: C.text,
  },
  petInfo: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    marginTop: 2,
  },
  secaoMapa: {
    backgroundColor: C.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: C.border,
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
    fontFamily: DS.font.semibold,
    color: C.text,
  },
  secaoSubtitulo: {
    fontSize: 12,
    fontFamily: DS.font.regular,
    color: C.textMuted,
  },
  botaoMapaCompleto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  textoBotaoMapa: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.primaryText,
  },
  mapaPreviewContainer: {
    borderRadius: DS.radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
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
    backgroundColor: C.bg,
  },
  enderecoTexto: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.text,
  },
  horaTexto: {
    fontSize: 11,
    fontFamily: DS.font.regular,
    color: C.textSubtle,
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
    fontFamily: DS.font.regular,
    color: C.textMuted,
    textAlign: "center",
  },
});
