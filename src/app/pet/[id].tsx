import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";

import { calcularIdade, excluirPet, isoParaData } from "@/controller/petController";
import { COLORS, DS } from "@/global/themes";
import { getPet, Pet } from "@/services/pets";
import { Leitura, listarLeiturasPorPet } from "@/services/leituras";
import PetMap from "@/components/PetMap";
import { Divider, TiltCard } from "@/components/ds";
import { PetIconBySpecies } from "@/components/PetIcons";

const C = DS.colors;

export default function PetDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);
  // Incrementado pelo botão "Tentar novamente" para refazer a busca
  const [tentativa, setTentativa] = useState(0);
  const [excluindo, setExcluindo] = useState(false);
  // Guarda a URL da foto que falhou; uma foto nova volta a ser exibida
  const [fotoComErro, setFotoComErro] = useState<string | null>(null);
  const carregouUmaVez = useRef(false);

  // Recarrega sempre que a tela ganha foco (ex.: ao voltar da edição)
  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      async function carregarDados() {
        if (!id) {
          setPet(null);
          setCarregando(false);
          return;
        }
        try {
          // Tela cheia de carregamento só na primeira vez
          if (!carregouUmaVez.current) setCarregando(true);
          const [dadosPet, dadosLeituras] = await Promise.all([
            getPet(id).catch(() => null),
            listarLeiturasPorPet(id).catch(() => []),
          ]);
          if (!ativo) return;

          setPet(dadosPet ?? null);
          setLeituras(dadosPet ? dadosLeituras : []);
        } finally {
          carregouUmaVez.current = true;
          if (ativo) setCarregando(false);
        }
      }

      carregarDados();
      return () => {
        ativo = false;
      };
      // tentativa: o botão "Tentar novamente" refaz a busca
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, tentativa]),
  );

  async function excluir() {
    if (!pet) return;
    setExcluindo(true);
    const resultado = await excluirPet(pet);
    setExcluindo(false);

    if (!resultado.sucesso) {
      if (Platform.OS === "web") {
        globalThis.alert?.(resultado.mensagem);
      } else {
        Alert.alert("Não foi possível excluir", resultado.mensagem);
      }
      return;
    }

    // Home e Perfil recarregam a lista de pets ao ganhar foco
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }

  function confirmarExclusao() {
    if (!pet) return;
    const mensagem = `Excluir ${pet.nome}? Essa ação não pode ser desfeita.`;
    // Alert.alert com botões não aparece na web (react-native-web)
    if (Platform.OS === "web") {
      if (globalThis.confirm?.(mensagem)) excluir();
      return;
    }
    Alert.alert("Excluir pet", mensagem, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: excluir },
    ]);
  }

  async function abrirVideo() {
    if (!pet?.video_url) return;
    try {
      await WebBrowser.openBrowserAsync(pet.video_url);
    } catch {
      Alert.alert("Vídeo", "Não foi possível abrir o vídeo.");
    }
  }

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

  if (!pet) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <View style={styles.naoEncontrado}>
          <Ionicons name="paw-outline" size={44} color={C.textSubtle} />
          <Text style={styles.naoEncontradoTitulo}>Pet não encontrado</Text>
          <Text style={styles.naoEncontradoTexto}>
            Não foi possível carregar este pet. Ele pode ter sido removido ou
            você não tem acesso a ele. Verifique sua conexão e tente novamente.
          </Text>

          <TouchableOpacity
            style={styles.botaoMapaCompleto}
            onPress={() => setTentativa((t) => t + 1)}
            accessibilityRole="button"
          >
            <Ionicons name="refresh" size={15} color={C.primaryText} />
            <Text style={styles.textoBotaoMapa}>Tentar novamente</Text>
          </TouchableOpacity>

          <Pressable
            onPress={voltar}
            hitSlop={8}
            accessibilityRole="button"
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Text style={styles.naoEncontradoVoltar}>Voltar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const ultimaLeitura = leituras.length > 0 ? leituras[0] : null;
  const idade = calcularIdade(pet.data_nascimento);
  const mostrarFoto = Boolean(pet.foto_url) && pet.foto_url !== fotoComErro;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.botaoVoltar, pressed && styles.pressed]}
          onPress={voltar}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Detalhes do Pet</Text>
        <Pressable
          style={({ pressed }) => [styles.botaoVoltar, pressed && styles.pressed]}
          onPress={() => router.push(`/pet/editar/${pet.id}` as any)}
          disabled={excluindo}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Editar ${pet.nome}`}
        >
          <Ionicons name="create-outline" size={20} color={C.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* CARD DO PET (3D Tilt Effect + Contraste Padrão AAA) */}
        <TiltCard
          variant="gradient"
          contentStyle={styles.cardPetContent}
          style={styles.cardPetContainer}
          padding={22}
        >
          <View style={styles.avatarWrapper}>
            {mostrarFoto ? (
              <Image
                source={{ uri: pet.foto_url }}
                style={styles.avatarFoto}
                onError={() => setFotoComErro(pet.foto_url ?? null)}
                accessibilityLabel={`Foto de ${pet.nome}`}
              />
            ) : (
              <PetIconBySpecies
                especie={pet?.especie}
                size={36}
                fallbackColor={COLORS.white}
              />
            )}
          </View>
          <Text style={styles.petNome}>{pet?.nome || "Pet"}</Text>
          <Text style={styles.petInfo}>
            {pet?.especie || "Espécie não informada"} • {pet?.raca || "Sem raça definida"}
          </Text>
          {idade ? <Text style={styles.petIdade}>{idade}</Text> : null}
        </TiltCard>

        {/* INFORMAÇÕES DO PET */}
        <View style={styles.secaoInfo}>
          <Text style={styles.secaoTitulo}>Informações</Text>

          <View style={styles.infoLinha}>
            <Ionicons name="calendar-outline" size={DS.icon.sm} color={C.textMuted} />
            <View style={styles.infoTextos}>
              <Text style={styles.infoRotulo}>Nascimento</Text>
              <Text style={styles.infoValor}>
                {pet.data_nascimento
                  ? `${isoParaData(pet.data_nascimento)}${idade ? ` · ${idade}` : ""}`
                  : "Não informado"}
              </Text>
            </View>
          </View>

          <View style={styles.infoLinha}>
            <Ionicons name="document-text-outline" size={DS.icon.sm} color={C.textMuted} />
            <View style={styles.infoTextos}>
              <Text style={styles.infoRotulo}>Observações</Text>
              <Text style={styles.infoValor}>
                {pet.observacoes || "Nenhuma observação cadastrada."}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.infoLinha,
              styles.infoLinhaUltima,
              Boolean(pet.video_url) && pressed && styles.pressed,
            ]}
            onPress={abrirVideo}
            disabled={!pet.video_url}
            accessibilityRole="button"
            accessibilityLabel="Assistir vídeo do pet"
          >
            <Ionicons
              name={pet.video_url ? "videocam" : "videocam-outline"}
              size={DS.icon.sm}
              color={C.textMuted}
            />
            <View style={styles.infoTextos}>
              <Text style={styles.infoRotulo}>Vídeo</Text>
              <Text style={styles.infoValor}>
                {pet.video_url ? "Toque para assistir" : "Nenhum vídeo cadastrado."}
              </Text>
            </View>
            {pet.video_url ? (
              <Ionicons name="play-circle-outline" size={22} color={C.primary} />
            ) : null}
          </Pressable>
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

        {/* EXCLUIR PET (mesmo padrão da linha "Sair da conta" do Perfil) */}
        <View>
          <Divider />
          <Pressable
            style={({ pressed }) => [
              styles.excluirLinha,
              pressed && styles.pressed,
              excluindo && styles.desabilitado,
            ]}
            onPress={confirmarExclusao}
            disabled={excluindo}
            accessibilityRole="button"
            accessibilityLabel={`Excluir ${pet.nome}`}
          >
            {excluindo ? (
              <ActivityIndicator size="small" color={C.danger} />
            ) : (
              <Ionicons name="trash-outline" size={DS.icon.md} color={C.danger} />
            )}
            <Text style={styles.excluirTexto}>
              {excluindo ? "Excluindo..." : "Excluir pet"}
            </Text>
          </Pressable>
          <Divider />
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
  naoEncontrado: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    maxWidth: 420,
  },
  naoEncontradoTitulo: {
    fontSize: 18,
    fontFamily: DS.font.bold,
    color: C.text,
  },
  naoEncontradoTexto: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    textAlign: "center",
    marginBottom: 4,
  },
  naoEncontradoVoltar: {
    fontSize: 14,
    fontFamily: DS.font.semibold,
    color: C.text,
    paddingVertical: 6,
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
    overflow: "hidden",
  },
  avatarFoto: {
    width: "100%",
    height: "100%",
  },
  petIdade: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.cardTextMuted,
    marginTop: 6,
  },
  secaoInfo: {
    backgroundColor: C.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 4,
  },
  infoLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
  },
  infoLinhaUltima: {
    borderBottomWidth: 0,
  },
  infoTextos: {
    flex: 1,
  },
  infoRotulo: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.text,
  },
  infoValor: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    marginTop: 1,
  },
  excluirLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
  },
  excluirTexto: {
    color: C.danger,
    fontFamily: DS.font.semibold,
    fontSize: 15,
  },
  desabilitado: {
    opacity: 0.5,
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
