import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorBanner, Field, FormHeader, PrimaryButton } from "@/components/ds";
import { DS } from "@/global/themes";
import { ArquivoSelecionado, enviarMidiaPet } from "@/services/petMidia";
import { criarPet } from "@/services/pets";

const C = DS.colors;
const ESPECIES = ["Cachorro", "Gato", "Outro"];
const LIMITE_VIDEO_MB = 50;

// Aplica a máscara DD/MM/AAAA enquanto a pessoa digita
function mascararData(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

// Converte DD/MM/AAAA para AAAA-MM-DD (formato do banco). Vazio é permitido.
function converterData(texto: string): { ok: boolean; iso?: string } {
  if (!texto.trim()) return { ok: true };
  if (texto.length !== 10) return { ok: false };

  const [dd, mm, aaaa] = texto.split("/").map(Number);
  const data = new Date(aaaa, mm - 1, dd);

  const existe =
    data.getFullYear() === aaaa &&
    data.getMonth() === mm - 1 &&
    data.getDate() === dd;

  if (!existe || aaaa < 1990 || data > new Date()) return { ok: false };

  const dois = (n: number) => String(n).padStart(2, "0");
  return { ok: true, iso: `${aaaa}-${dois(mm)}-${dois(dd)}` };
}

export default function NovoPet() {
  const [nome, setNome] = useState("");
  const [especie, setEspecie] = useState("Cachorro");
  const [raca, setRaca] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [foto, setFoto] = useState<ArquivoSelecionado | null>(null);
  const [video, setVideo] = useState<ArquivoSelecionado | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function voltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }

  async function escolherFoto() {
    setErro(null);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) setFoto(res.assets[0]);
  }

  async function escolherVideo() {
    setErro(null);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 60,
    });
    if (res.canceled) return;

    const asset = res.assets[0];
    if (asset.fileSize && asset.fileSize > LIMITE_VIDEO_MB * 1024 * 1024) {
      setErro(`O vídeo deve ter no máximo ${LIMITE_VIDEO_MB} MB.`);
      return;
    }
    setVideo(asset);
  }

  async function salvar() {
    setErro(null);

    if (!nome.trim()) {
      setErro("Informe o nome do pet.");
      return;
    }

    const data = converterData(dataNascimento);
    if (!data.ok) {
      setErro("Data de nascimento inválida. Use o formato DD/MM/AAAA.");
      return;
    }

    try {
      setCarregando(true);

      const foto_url = foto ? await enviarMidiaPet(foto, "foto") : undefined;
      const video_url = video
        ? await enviarMidiaPet(video, "video")
        : undefined;

      await criarPet({
        nome: nome.trim(),
        especie,
        raca: raca.trim() || undefined,
        data_nascimento: data.iso,
        foto_url,
        video_url,
        observacoes: observacoes.trim() || undefined,
      });

      router.replace("/(tabs)");
    } catch (e: any) {
      setErro(e?.message || "Não foi possível cadastrar o pet.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      {/* HEADER COM BOTÃO VOLTAR */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.botaoVoltar, pressed && s.pressed]}
          onPress={voltar}
          disabled={carregando}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.headerTitulo}>Novo Pet</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.formulario}>
            <FormHeader
              eyebrow="Novo pet"
              title="Cadastrar pet"
              subtitle="Preencha os dados para proteger seu pet com a medalha PetSafe."
            />

            {erro ? <ErrorBanner message={erro} /> : null}

            {/* FOTO */}
            <View style={s.fotoArea}>
              <Pressable
                onPress={escolherFoto}
                disabled={carregando}
                style={({ pressed }) => [s.fotoBox, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Escolher foto do pet"
              >
                {foto ? (
                  <Image source={{ uri: foto.uri }} style={s.fotoImagem} />
                ) : (
                  <View style={s.fotoVazia}>
                    <Ionicons
                      name="camera-outline"
                      size={28}
                      color={C.textSubtle}
                    />
                    <Text style={s.fotoTexto}>Adicionar foto</Text>
                  </View>
                )}
              </Pressable>
              {foto ? (
                <Pressable
                  onPress={() => setFoto(null)}
                  disabled={carregando}
                  hitSlop={8}
                >
                  <Text style={s.removerTexto}>Remover foto</Text>
                </Pressable>
              ) : null}
            </View>

            <Field
              label="Nome do pet"
              icon="paw-outline"
              value={nome}
              onChangeText={(v) => {
                setNome(v);
                if (erro) setErro(null);
              }}
              placeholder="Ex.: Pipoca"
              autoCapitalize="words"
              returnKeyType="next"
              editable={!carregando}
            />

            <Text style={s.label}>Espécie</Text>
            <View style={s.chips}>
              {ESPECIES.map((opcao) => {
                const ativo = especie === opcao;
                return (
                  <Pressable
                    key={opcao}
                    onPress={() => setEspecie(opcao)}
                    disabled={carregando}
                    style={[s.chip, ativo && s.chipAtivo]}
                  >
                    <Text style={[s.chipTexto, ativo && s.chipTextoAtivo]}>
                      {opcao}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Field
              label="Raça"
              icon="ribbon-outline"
              value={raca}
              onChangeText={setRaca}
              placeholder="Ex.: Golden Retriever"
              autoCapitalize="words"
              returnKeyType="next"
              editable={!carregando}
            />

            <Field
              label="Data de nascimento"
              icon="calendar-outline"
              value={dataNascimento}
              onChangeText={(v) => {
                setDataNascimento(mascararData(v));
                if (erro) setErro(null);
              }}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              returnKeyType="next"
              editable={!carregando}
            />

            {/* VÍDEO */}
            <Text style={s.label}>Vídeo (opcional)</Text>
            <View style={s.videoLinha}>
              <Pressable
                onPress={escolherVideo}
                disabled={carregando}
                style={({ pressed }) => [s.videoBotao, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Escolher vídeo do pet"
              >
                <Ionicons
                  name={video ? "videocam" : "videocam-outline"}
                  size={22}
                  color={video ? C.text : C.textSubtle}
                />
                <Text style={s.videoTexto} numberOfLines={1}>
                  {video
                    ? video.fileName || "Vídeo selecionado"
                    : "Adicionar vídeo (até 60 s)"}
                </Text>
              </Pressable>
              {video ? (
                <Pressable
                  onPress={() => setVideo(null)}
                  disabled={carregando}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={24} color={C.textMuted} />
                </Pressable>
              ) : null}
            </View>

            <Field
              label="Observações"
              icon="document-text-outline"
              value={observacoes}
              onChangeText={setObservacoes}
              placeholder="Temperamento, alergias..."
              returnKeyType="done"
              onSubmitEditing={salvar}
              editable={!carregando}
            />

            <View style={{ marginTop: 8 }}>
              <PrimaryButton
                label="Salvar pet"
                onPress={salvar}
                loading={carregando}
                disabled={carregando}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },

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
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  headerTitulo: { fontSize: 18, fontFamily: DS.font.bold, color: C.text },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formulario: { width: "100%", maxWidth: 480 },

  fotoArea: { alignItems: "center", gap: 8, marginBottom: 16 },
  fotoBox: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: "hidden",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  fotoImagem: { width: "100%", height: "100%" },
  fotoVazia: { alignItems: "center", gap: 4 },
  fotoTexto: { fontSize: 11, fontFamily: DS.font.semibold, color: C.textMuted },
  removerTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.textMuted,
  },

  label: {
    fontSize: 13,
    fontFamily: DS.font.semibold,
    color: C.text,
    marginBottom: 8,
  },
  chips: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipAtivo: { backgroundColor: C.primary, borderColor: C.primary },
  chipTexto: { fontSize: 13, fontFamily: DS.font.semibold, color: C.textMuted },
  chipTextoAtivo: { color: C.primaryText },

  videoLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  videoBotao: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  videoTexto: {
    flex: 1,
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.textMuted,
  },
});
