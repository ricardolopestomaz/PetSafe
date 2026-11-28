import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
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

import { TiltCard } from "@/components/ds";
import FichaMedicaResumo from "@/components/FichaMedicaResumo";
import { PetIconBySpecies } from "@/components/PetIcons";
import PetMap from "@/components/PetMap";
import { COLORS, DS } from "@/global/themes";
import { Leitura, listarLeiturasPorPet } from "@/services/leituras";
import { getPet, Pet } from "@/services/pets";

const C = DS.colors;

export default function PetDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Recarrega sempre que a tela volta ao foco (ex.: depois de editar o pet)
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarDados() {
        if (!id) return;
        try {
          const [dadosPet, dadosLeituras] = await Promise.all([
            getPet(id).catch(() => null),
            listarLeiturasPorPet(id).catch(() => []),
          ]);
          if (!ativo) return;
          setPet(dadosPet);
          setLeituras(dadosLeituras);
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregarDados();
      return () => {
        ativo = false;
      };
    }, [id]),
  );

  function voltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
      </SafeAreaView>
    );
  }

  // Pet não encontrado (apagado, sem permissão ou erro de conexão)
  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [
              styles.botaoVoltar,
              pressed && styles.pressed,
            ]}
            onPress={voltar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitulo}>Detalhes do Pet</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centerContainer}>
          <Ionicons name="paw-outline" size={36} color={C.textSubtle} />
          <Text style={styles.semLeiturasTexto}>Pet não encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ultimaLeitura = leituras.length > 0 ? leituras[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {/* VOLTAR (esquerda) */}
        <Pressable
          style={({ pressed }) => [
            styles.botaoVoltar,
            pressed && styles.pressed,
          ]}
          onPress={voltar}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>

        <Text style={styles.headerTitulo}>Detalhes do Pet</Text>

        {/* EDITAR (direita, colorido) */}
        <Pressable
          style={({ pressed }) => [
            styles.botaoEditar,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push({ pathname: "/pet/editar" as any, params: { id } })
          }
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Editar pet"
        >
          <Ionicons name="create" size={20} color={C.primaryText} />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* CARD DO PET (3D Tilt Effect + Contraste Padrão AAA) */}
        <TiltCard
          variant="gradient"
          contentStyle={styles.cardPetContent}
          style={styles.cardPetContainer}
          padding={22}
        >
          <View style={styles.avatarWrapper}>
            <PetIconBySpecies
              especie={pet.especie}
              size={36}
              fallbackColor={COLORS.white}
            />
          </View>
          <Text style={styles.petNome}>{pet.nome || "Pet"}</Text>
          <Text style={styles.petInfo}>
            {pet.especie || "Espécie não informada"} •{" "}
            {pet.raca || "Sem raça definida"}
          </Text>
        </TiltCard>

        {/* FICHA MÉDICA BÁSICA */}
        {id ? <FichaMedicaResumo petId={id} /> : null}

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
                  <Ionicons
                    name="location-sharp"
                    size={18}
                    color={COLORS.yellow}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.enderecoTexto} numberOfLines={2}>
                      {ultimaLeitura.endereco_aproximado ||
                        `${ultimaLeitura.bairro || ""} ${ultimaLeitura.cidade || ""}`.trim() ||
                        `Lat: ${ultimaLeitura.latitude.toFixed(4)}, Long: ${ultimaLeitura.longitude.toFixed(4)}`}
                    </Text>
                    <Text style={styles.horaTexto}>
                      Registrado em:{" "}
                      {new Date(ultimaLeitura.criado_em).toLocaleString(
                        "pt-BR",
                      )}
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
    gap: 10,
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
  botaoEditar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
  cardPetContainer: {
    width: "100%",
  },
  cardPetContent: {
    alignItems: "center",
  },
  avatarWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: C.cardBadgeBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBadgeBorder,
  },
  petNome: {
    fontSize: 22,
    fontFamily: DS.font.bold,
    color: C.cardText,
  },
  petInfo: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.cardTextMuted,
    marginTop: 3,
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
