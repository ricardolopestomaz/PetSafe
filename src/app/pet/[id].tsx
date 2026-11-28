import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FichaMedicaResumo from "@/components/FichaMedicaResumo";
import { PetIconBySpecies } from "@/components/PetIcons";
import PetMap from "@/components/PetMap";
import { COLORS, DS } from "@/global/themes";
import { Leitura, listarLeiturasPorPet } from "@/services/leituras";
import { getPet, Pet } from "@/services/pets";

const C = DS.colors;

// Cores do card do topo, vindas do tema (âmbar de destaque + azul da marca)
const FUNDO_CARD = COLORS.yellow;
const TEXTO_CARD = COLORS.blue;

// AAAA-MM-DD -> DD/MM/AAAA
function formatarData(iso?: string | null): string | null {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split("-");
  return a && m && d ? `${d}/${m}/${a}` : null;
}

// Calcula a idade a partir de AAAA-MM-DD
function calcularIdade(iso?: string | null): string | null {
  if (!iso) return null;
  const nascimento = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (isNaN(nascimento.getTime())) return null;

  const hoje = new Date();
  let meses =
    (hoje.getFullYear() - nascimento.getFullYear()) * 12 +
    (hoje.getMonth() - nascimento.getMonth());
  if (hoje.getDate() < nascimento.getDate()) meses--;

  if (meses < 0) return null;
  if (meses < 1) return "Menos de 1 mês";
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;

  const anos = Math.floor(meses / 12);
  return `${anos} ${anos === 1 ? "ano" : "anos"}`;
}

// Player de vídeo (componente separado porque usa hooks)
function VideoPet({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      nativeControls
    />
  );
}

function LinhaInfo({
  icone,
  titulo,
  valor,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  valor: string | null | undefined;
}) {
  return (
    <View style={styles.linhaInfo}>
      <View style={styles.linhaIcone}>
        <Ionicons name={icone} size={16} color={C.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.linhaTitulo}>{titulo}</Text>
        <Text style={[styles.linhaValor, !valor && styles.linhaValorVazio]}>
          {valor || "Não informado"}
        </Text>
      </View>
    </View>
  );
}

export default function PetDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroFoto, setErroFoto] = useState(false);

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
          setErroFoto(false);
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
  const mostrarFoto = Boolean(pet.foto_url) && !erroFoto;
  const idade = calcularIdade(pet.data_nascimento);
  const nascimento = formatarData(pet.data_nascimento);
  const cadastradoEm = formatarData(pet.criado_em);

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
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
        {/* CARD DO PET (fundo âmbar, com a foto do banco) */}
        <View style={styles.cardPet}>
          <View style={styles.fotoWrapper}>
            {mostrarFoto ? (
              <Image
                source={{ uri: pet.foto_url }}
                style={styles.fotoImagem}
                resizeMode="cover"
                onError={() => setErroFoto(true)}
              />
            ) : (
              <PetIconBySpecies
                especie={pet.especie}
                size={44}
                fallbackColor={TEXTO_CARD}
              />
            )}
          </View>

          <Text style={styles.petNome}>{pet.nome || "Pet"}</Text>
          <Text style={styles.petInfo}>
            {pet.especie || "Espécie não informada"} •{" "}
            {pet.raca || "Sem raça definida"}
          </Text>

          <View style={styles.tags}>
            {pet.especie ? (
              <View style={styles.tag}>
                <Text style={styles.tagTexto}>{pet.especie}</Text>
              </View>
            ) : null}
            {idade ? (
              <View style={styles.tag}>
                <Text style={styles.tagTexto}>{idade}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* SOBRE O PET */}
        <View style={styles.secao}>
          <Text style={styles.secaoTitulo}>Sobre o pet</Text>

          <LinhaInfo
            icone="calendar-outline"
            titulo="Data de nascimento"
            valor={
              nascimento ? `${nascimento}${idade ? ` (${idade})` : ""}` : null
            }
          />
          <LinhaInfo icone="ribbon-outline" titulo="Raça" valor={pet.raca} />
          <LinhaInfo icone="paw-outline" titulo="Espécie" valor={pet.especie} />
          <LinhaInfo
            icone="document-text-outline"
            titulo="Observações"
            valor={pet.observacoes}
          />
          <LinhaInfo
            icone="time-outline"
            titulo="Cadastrado em"
            valor={cadastradoEm}
          />
        </View>

        {/* VÍDEO DO PET (só aparece se tiver vídeo) */}
        {pet.video_url ? (
          <View style={styles.secao}>
            <Text style={styles.secaoTitulo}>Vídeo do pet</Text>
            <View style={styles.videoWrapper}>
              <VideoPet uri={pet.video_url} />
            </View>
          </View>
        ) : null}

        {/* FICHA MÉDICA BÁSICA */}
        {id ? <FichaMedicaResumo petId={id} /> : null}

        {/* SEÇÃO DO MAPA / ÚLTIMA LEITURA */}
        <View style={styles.secao}>
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

  /* Header */
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

  /* Card do pet (âmbar do tema) */
  cardPet: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: DS.radius.lg,
    backgroundColor: FUNDO_CARD,
    shadowColor: FUNDO_CARD,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fotoWrapper: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.9)",
    marginBottom: 12,
  },
  fotoImagem: {
    width: "100%",
    height: "100%",
  },
  petNome: {
    fontSize: 24,
    fontFamily: DS.font.bold,
    color: TEXTO_CARD,
  },
  petInfo: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: TEXTO_CARD,
    opacity: 0.85,
    marginTop: 3,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(29, 30, 100, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(29, 30, 100, 0.22)",
  },
  tagTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: TEXTO_CARD,
  },

  /* Seções */
  secao: {
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

  /* Linhas de informação */
  linhaInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  linhaIcone: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  linhaTitulo: {
    fontSize: 11,
    fontFamily: DS.font.semibold,
    color: C.textMuted,
  },
  linhaValor: {
    fontSize: 14,
    fontFamily: DS.font.regular,
    color: C.text,
    marginTop: 1,
  },
  linhaValorVazio: {
    color: C.textSubtle,
  },

  /* Vídeo */
  videoWrapper: {
    borderRadius: DS.radius.md,
    overflow: "hidden",
    backgroundColor: "#000000",
    borderWidth: 1,
    borderColor: C.border,
  },
  video: {
    width: "100%",
    height: 220,
  },

  /* Mapa */
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
