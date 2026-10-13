import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/global/themes";
import PetMap from "@/components/PetMap";
import { listarMeusPets, Pet } from "@/services/pets";
import {
  Leitura,
  listarLeiturasPorPet,
  listarTodasLeituras,
} from "@/services/leituras";

export default function MapaScreen() {
  const params = useLocalSearchParams<{ petId?: string }>();
  const [petSelecionadoId, setPetSelecionadoId] = useState<string | null>(
    params.petId || null
  );

  const [pets, setPets] = useState<Pet[]>([]);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [leituraSelecionada, setLeituraSelecionada] = useState<Leitura | null>(
    null
  );

  // Carrega lista de pets do tutor
  async function carregarPets() {
    try {
      const data = await listarMeusPets();
      setPets(data || []);
    } catch {
      // Ignora erro em dev
    }
  }

  // Carrega as leituras com base no filtro selecionado
  async function carregarLeituras(petId?: string | null) {
    try {
      setCarregando(true);
      let dados: Leitura[] = [];

      if (petId) {
        dados = await listarLeiturasPorPet(petId);
      } else {
        dados = await listarTodasLeituras();
      }

      setLeituras(dados);
      if (dados.length > 0) {
        setLeituraSelecionada(dados[0]);
      } else {
        setLeituraSelecionada(null);
      }
    } catch (err) {
      console.warn("Erro ao carregar leituras no mapa:", err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      carregarPets();
    });
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      carregarLeituras(petSelecionadoId);
    });
  }, [petSelecionadoId]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* HEADER SUPERIOR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botaoVoltar}
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.blue} />
        </TouchableOpacity>

        <View style={styles.headerTextos}>
          <Text style={styles.headerTitulo}>Mapa de Leituras</Text>
          <Text style={styles.headerSubtitulo}>
            Histórico de escaneamentos das medalhas
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botaoRecarregar}
          onPress={() => carregarLeituras(petSelecionadoId)}
          disabled={carregando}
        >
          <Ionicons
            name="refresh"
            size={20}
            color={carregando ? COLORS.placeholder : COLORS.blue}
          />
        </TouchableOpacity>
      </View>

      {/* FILTRO DE PETS (CHIPS HORIZONTAIS) */}
      <View style={styles.containerFiltros}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: "todos", nome: "Todos os Pets" }, ...pets]}
          keyExtractor={(item) => item.id || item.nome}
          contentContainerStyle={styles.listaFiltros}
          renderItem={({ item }) => {
            const isTodos = item.id === "todos";
            const isAtivo = isTodos
              ? petSelecionadoId === null
              : petSelecionadoId === item.id;

            return (
              <TouchableOpacity
                style={[styles.chipFiltro, isAtivo && styles.chipFiltroAtivo]}
                onPress={() => {
                  setPetSelecionadoId(isTodos ? null : item.id || null);
                }}
              >
                <Ionicons
                  name={isTodos ? "paw-outline" : "paw"}
                  size={14}
                  color={isAtivo ? COLORS.white : COLORS.blue}
                />
                <Text
                  style={[
                    styles.textoChipFiltro,
                    isAtivo && styles.textoChipFiltroAtivo,
                  ]}
                >
                  {item.nome}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ÁREA DO MAPA */}
      <View style={styles.mapaWrapper}>
        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.yellow} />
            <Text style={styles.textoCarregando}>Carregando posições no mapa...</Text>
          </View>
        ) : leituras.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={56} color={COLORS.cinzaclaro} />
            <Text style={styles.emptyTitulo}>Nenhuma leitura encontrada</Text>
            <Text style={styles.emptySubtitulo}>
              Quando a medalha do seu pet for escaneada, a localização aparecerá aqui.
            </Text>
          </View>
        ) : (
          <PetMap
            leituras={leituras}
            leituraSelecionada={leituraSelecionada}
            onSelecionarLeitura={(l) => setLeituraSelecionada(l)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
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
    marginRight: 12,
  },
  headerTextos: {
    flex: 1,
  },
  headerTitulo: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  headerSubtitulo: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  botaoRecarregar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  containerFiltros: {
    paddingVertical: 10,
    backgroundColor: COLORS.white,
  },
  listaFiltros: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chipFiltro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F2FA",
  },
  chipFiltroAtivo: {
    backgroundColor: COLORS.blue,
  },
  textoChipFiltro: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  textoChipFiltroAtivo: {
    color: COLORS.white,
  },
  mapaWrapper: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  textoCarregando: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitulo: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
    textAlign: "center",
  },
  emptySubtitulo: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
    textAlign: "center",
    lineHeight: 20,
  },
});
