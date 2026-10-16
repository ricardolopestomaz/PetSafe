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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/global/themes";
import PetMap from "@/components/PetMap";
import RodapeNav from "@/components/RodapeNav";
import { listarMeusPets, Pet } from "@/services/pets";
import {
  Leitura,
  listarLeiturasPorPet,
  listarTodasLeituras,
  simularNovoEscaneamento,
} from "@/services/leituras";

export default function MapaScreen() {
  const params = useLocalSearchParams<{ petId?: string }>();
  const [petSelecionadoId, setPetSelecionadoId] = useState<string | null>(
    params.petId || null
  );

  const [pets, setPets] = useState<Pet[]>([]);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [simulando, setSimulando] = useState(false);
  const [mostrarTrajeto, setMostrarTrajeto] = useState(true);
  const [avisoNovoScan, setAvisoNovoScan] = useState<string | null>(null);
  const [leituraSelecionada, setLeituraSelecionada] = useState<Leitura | null>(
    null
  );

  // Carrega lista de pets do tutor
  const carregarPets = React.useCallback(async () => {
    try {
      const data = await listarMeusPets();
      const listaPets = data || [];
      setPets(listaPets);

      // Se nenhum pet específico foi passado via rota, seleciona o primeiro cachorro
      if (!params.petId && listaPets.length > 0) {
        const primeiroCachorro = listaPets.find(
          (p) =>
            p.especie?.toLowerCase().includes("cachorro") ||
            p.especie?.toLowerCase().includes("cão")
        );
        if (primeiroCachorro?.id) {
          setPetSelecionadoId(primeiroCachorro.id);
        }
      }
    } catch {
      // Ignora erro em dev
    }
  }, [params.petId]);

  // Carrega as leituras com base no filtro selecionado
  const carregarLeituras = React.useCallback(async (petId?: string | null) => {
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
  }, []);

  // Simula um novo escaneamento para testar o mapa interativo
  async function dispararSimulacao() {
    try {
      setSimulando(true);
      const petIdAlvo = petSelecionadoId || pets[0]?.id || "demo-pet-1";
      const novoScan = await simularNovoEscaneamento(petIdAlvo);

      setLeituras((prev) => [novoScan, ...prev]);
      setLeituraSelecionada(novoScan);

      setAvisoNovoScan(
        `📍 Nova leitura registrada de ${novoScan.pet?.nome || "Cachorro"}!`
      );
      setTimeout(() => setAvisoNovoScan(null), 4000);
    } catch (e) {
      console.warn("Erro ao simular escaneamento:", e);
    } finally {
      setSimulando(false);
    }
  }

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(async () => {
      if (ativo) {
        await carregarPets();
      }
    });
    return () => {
      ativo = false;
    };
  }, [carregarPets]);

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(async () => {
      if (ativo) {
        await carregarLeituras(petSelecionadoId);
      }
    });
    return () => {
      ativo = false;
    };
  }, [carregarLeituras, petSelecionadoId]);

  // Pet atualmente selecionado
  const petAtual = pets.find((p) => p.id === petSelecionadoId);
  const ultimaLeitura = leituras.length > 0 ? leituras[0] : null;

  function formatarDataRegistro(isoString: string) {
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    } catch {
      return isoString;
    }
  }

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
          <Text style={styles.headerTitulo}>Mapa de Escaneamentos</Text>
          <Text style={styles.headerSubtitulo}>
            Últimas localizações registradas do pet
          </Text>
        </View>

        <View style={styles.headerAcoes}>
          <TouchableOpacity
            style={styles.botaoSimular}
            onPress={dispararSimulacao}
            disabled={simulando}
            accessibilityLabel="Simular novo escaneamento"
          >
            {simulando ? (
              <ActivityIndicator size="small" color={COLORS.blue} />
            ) : (
              <>
                <Ionicons name="add-circle" size={16} color={COLORS.blue} />
                <Text style={styles.textoBotaoSimular}>Simular</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoRecarregar}
            onPress={() => carregarLeituras(petSelecionadoId)}
            disabled={carregando}
            accessibilityLabel="Recarregar"
          >
            <Ionicons
              name="refresh"
              size={18}
              color={carregando ? COLORS.placeholder : COLORS.blue}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* AVISO TOAST FLUTUANTE DE NOVO ESCANEAMENTO */}
      {avisoNovoScan && (
        <View style={styles.toastContainer}>
          <Ionicons name="notifications" size={16} color={COLORS.blue} />
          <Text style={styles.toastTexto}>{avisoNovoScan}</Text>
        </View>
      )}

      {/* FILTRO DE PETS (CHIPS HORIZONTAIS) */}
      <View style={styles.containerFiltros}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: "todos", nome: "Todos os Pets", especie: "" }, ...pets]}
          keyExtractor={(item) => item.id || item.nome}
          contentContainerStyle={styles.listaFiltros}
          renderItem={({ item }) => {
            const isTodos = item.id === "todos";
            const isAtivo = isTodos
              ? petSelecionadoId === null
              : petSelecionadoId === item.id;
            const isCachorro =
              item.especie?.toLowerCase().includes("cachorro") ||
              item.especie?.toLowerCase().includes("cão");

            return (
              <TouchableOpacity
                style={[styles.chipFiltro, isAtivo && styles.chipFiltroAtivo]}
                onPress={() => {
                  setPetSelecionadoId(isTodos ? null : item.id || null);
                }}
              >
                <Ionicons
                  name={isCachorro ? "paw" : isTodos ? "layers-outline" : "paw-outline"}
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
                  {isCachorro ? " 🐶" : ""}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* BANNER INFORMATIVO DO CACHORRO E ÚLTIMO SCAN */}
      <View style={styles.bannerPetInfo}>
        <View style={styles.avatarPetPequeno}>
          <MaterialCommunityIcons name="paw" size={18} color={COLORS.blue} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.petTituloLinha}>
            <Text style={styles.petNomeDestaque}>
              {petAtual?.nome || "Últimos Escaneamentos"}
            </Text>
            {petAtual?.raca && (
              <Text style={styles.petRacaDestaque}>• {petAtual.raca}</Text>
            )}
          </View>

          <View style={styles.petStatusLinha}>
            <View style={styles.pontoVerdePulsante} />
            <Text style={styles.petStatusTexto}>
              {ultimaLeitura
                ? `Último registro: ${formatarDataRegistro(
                    ultimaLeitura.criado_em
                  )}`
                : "Sem leituras registradas"}
            </Text>
          </View>
        </View>

        {/* BOTAO ALTERNAR TRAJETO */}
        <TouchableOpacity
          style={[
            styles.botaoTrajeto,
            mostrarTrajeto && styles.botaoTrajetoAtivo,
          ]}
          onPress={() => setMostrarTrajeto(!mostrarTrajeto)}
          accessibilityLabel="Alternar visualização do trajeto"
        >
          <MaterialCommunityIcons
            name="map-marker-path"
            size={16}
            color={mostrarTrajeto ? COLORS.white : COLORS.blue}
          />
          <Text
            style={[
              styles.textoBotaoTrajeto,
              mostrarTrajeto && styles.textoBotaoTrajetoAtivo,
            ]}
          >
            Trajeto
          </Text>
        </TouchableOpacity>
      </View>

      {/* ÁREA DO MAPA INTERATIVO */}
      <View style={styles.mapaWrapper}>
        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.yellow} />
            <Text style={styles.textoCarregando}>
              Carregando escaneamentos no mapa...
            </Text>
          </View>
        ) : leituras.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconeWrapper}>
              <Ionicons name="location-outline" size={48} color={COLORS.blue} />
            </View>
            <Text style={styles.emptyTitulo}>
              Nenhum escaneamento recente
            </Text>
            <Text style={styles.emptySubtitulo}>
              Quando a medalha inteligente do seu cachorro for aproximada ou o
              QR Code for lido, a localização aparecerá neste mapa em tempo real.
            </Text>

            <TouchableOpacity
              style={styles.botaoTestarAgora}
              onPress={dispararSimulacao}
            >
              <Ionicons name="flash-outline" size={16} color={COLORS.white} />
              <Text style={styles.textoBotaoTestar}>
                Simular Escaneamento Agora
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <PetMap
            leituras={leituras}
            leituraSelecionada={leituraSelecionada}
            onSelecionarLeitura={(l) => setLeituraSelecionada(l)}
            mostrarTrajeto={mostrarTrajeto}
            mostrarControles={true}
          />
        )}
      </View>

      {/* RODAPÉ DE NAVEGAÇÃO INFERIOR */}
      <RodapeNav abaAtiva="scanner" />
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  botaoVoltar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F5F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerTextos: {
    flex: 1,
  },
  headerTitulo: {
    fontSize: 17,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  headerSubtitulo: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  headerAcoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  botaoSimular: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.yellow,
  },
  textoBotaoSimular: {
    fontSize: 11,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  botaoRecarregar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  // Toast
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF9C3",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FDE047",
  },
  toastTexto: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },

  // Filtros
  containerFiltros: {
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F9",
  },
  listaFiltros: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipFiltro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#F0F2FA",
  },
  chipFiltroAtivo: {
    backgroundColor: COLORS.blue,
  },
  textoChipFiltro: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  textoChipFiltroAtivo: {
    color: COLORS.white,
  },

  // Banner do Pet
  bannerPetInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F8F9FE",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEBFA",
    gap: 10,
  },
  avatarPetPequeno: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  petTituloLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  petNomeDestaque: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
  petRacaDestaque: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  petStatusLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  pontoVerdePulsante: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#10B981",
  },
  petStatusTexto: {
    fontSize: 11,
    fontFamily: "Poppins_500Medium",
    color: "#4B5563",
  },
  botaoTrajeto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EEF0FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D5D8FF",
  },
  botaoTrajetoAtivo: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  textoBotaoTrajeto: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  textoBotaoTrajetoAtivo: {
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
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: COLORS.roxoclaro,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    gap: 10,
  },
  emptyIconeWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F2FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitulo: {
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
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
  botaoTestarAgora: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginTop: 8,
  },
  textoBotaoTestar: {
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.white,
  },
});
