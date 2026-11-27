import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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

import { ErrorBanner, Field, FormHeader, PrimaryButton } from "@/components/ds";
import {
  ESPECIES,
  FormularioPet,
  LIMITE_VIDEO_MB,
  mascararData,
} from "@/controller/petController";
import { DS } from "@/global/themes";

const C = DS.colors;

type Props = {
  inicial: FormularioPet;
  eyebrow: string;
  titulo: string;
  subtitulo: string;
  rotuloBotao: string;
  salvando: boolean;
  erro: string | null;
  onErro: (mensagem: string | null) => void;
  onSalvar: (form: FormularioPet) => void;
};

/** Formulário de pet compartilhado pelo cadastro (/pet/novo) e pela edição (/pet/editar/[id]). */
export default function PetForm({
  inicial,
  eyebrow,
  titulo,
  subtitulo,
  rotuloBotao,
  salvando,
  erro,
  onErro,
  onSalvar,
}: Props) {
  const [form, setForm] = useState<FormularioPet>(inicial);

  function alterar<K extends keyof FormularioPet>(
    campo: K,
    valor: FormularioPet[K],
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    if (erro) onErro(null);
  }

  async function escolherFoto() {
    onErro(null);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) alterar("novaFoto", res.assets[0]);
  }

  function removerFoto() {
    setForm((atual) => ({ ...atual, novaFoto: null, fotoUrlAtual: null }));
  }

  async function escolherVideo() {
    onErro(null);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 60,
    });
    if (res.canceled) return;

    const asset = res.assets[0];
    if (asset.fileSize && asset.fileSize > LIMITE_VIDEO_MB * 1024 * 1024) {
      onErro(`O vídeo deve ter no máximo ${LIMITE_VIDEO_MB} MB.`);
      return;
    }
    alterar("novoVideo", asset);
  }

  function removerVideo() {
    setForm((atual) => ({ ...atual, novoVideo: null, videoUrlAtual: null }));
  }

  const fotoExibida = form.novaFoto?.uri ?? form.fotoUrlAtual;
  const temVideo = Boolean(form.novoVideo || form.videoUrlAtual);
  const nomeVideo = form.novoVideo
    ? form.novoVideo.fileName || "Vídeo selecionado"
    : "Vídeo atual do pet";

  return (
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
          <FormHeader eyebrow={eyebrow} title={titulo} subtitle={subtitulo} />

          {erro ? <ErrorBanner message={erro} /> : null}

          {/* FOTO */}
          <View style={s.fotoArea}>
            <Pressable
              onPress={escolherFoto}
              disabled={salvando}
              style={({ pressed }) => [s.fotoBox, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Escolher foto do pet"
            >
              {fotoExibida ? (
                <Image source={{ uri: fotoExibida }} style={s.fotoImagem} />
              ) : (
                <View style={s.fotoVazia}>
                  <Ionicons name="camera-outline" size={28} color={C.textSubtle} />
                  <Text style={s.fotoTexto}>Adicionar foto</Text>
                </View>
              )}
            </Pressable>
            {fotoExibida ? (
              <View style={s.fotoAcoes}>
                <Pressable onPress={escolherFoto} disabled={salvando} hitSlop={8}>
                  <Text style={s.removerTexto}>Trocar foto</Text>
                </Pressable>
                <Text style={s.separador}>·</Text>
                <Pressable onPress={removerFoto} disabled={salvando} hitSlop={8}>
                  <Text style={s.removerTexto}>Remover foto</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <Field
            label="Nome do pet"
            icon="paw-outline"
            value={form.nome}
            onChangeText={(v) => alterar("nome", v)}
            placeholder="Ex.: Pipoca"
            autoCapitalize="words"
            returnKeyType="next"
            editable={!salvando}
          />

          <Text style={s.label}>Espécie</Text>
          <View style={s.chips}>
            {ESPECIES.map((opcao) => {
              const ativo = form.especie === opcao;
              return (
                <Pressable
                  key={opcao}
                  onPress={() => alterar("especie", opcao)}
                  disabled={salvando}
                  style={[s.chip, ativo && s.chipAtivo]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
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
            value={form.raca}
            onChangeText={(v) => alterar("raca", v)}
            placeholder="Ex.: Golden Retriever"
            autoCapitalize="words"
            returnKeyType="next"
            editable={!salvando}
          />

          <Field
            label="Data de nascimento"
            icon="calendar-outline"
            value={form.dataNascimento}
            onChangeText={(v) => alterar("dataNascimento", mascararData(v))}
            placeholder="DD/MM/AAAA"
            keyboardType="numeric"
            returnKeyType="next"
            editable={!salvando}
          />

          {/* VÍDEO */}
          <Text style={s.label}>Vídeo (opcional)</Text>
          <View style={s.videoLinha}>
            <Pressable
              onPress={escolherVideo}
              disabled={salvando}
              style={({ pressed }) => [s.videoBotao, pressed && s.pressed]}
              accessibilityRole="button"
              accessibilityLabel={temVideo ? "Trocar vídeo do pet" : "Escolher vídeo do pet"}
            >
              <Ionicons
                name={temVideo ? "videocam" : "videocam-outline"}
                size={22}
                color={temVideo ? C.text : C.textSubtle}
              />
              <Text style={s.videoTexto} numberOfLines={1}>
                {temVideo ? nomeVideo : "Adicionar vídeo (até 60 s)"}
              </Text>
            </Pressable>
            {temVideo ? (
              <Pressable
                onPress={removerVideo}
                disabled={salvando}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remover vídeo"
              >
                <Ionicons name="close-circle" size={24} color={C.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <Field
            label="Observações"
            icon="document-text-outline"
            value={form.observacoes}
            onChangeText={(v) => alterar("observacoes", v)}
            placeholder="Temperamento, alergias..."
            returnKeyType="done"
            onSubmitEditing={() => onSalvar(form)}
            editable={!salvando}
          />

          <View style={{ marginTop: 8 }}>
            <PrimaryButton
              label={rotuloBotao}
              onPress={() => onSalvar(form)}
              loading={salvando}
              disabled={salvando}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
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
  fotoAcoes: { flexDirection: "row", alignItems: "center", gap: 8 },
  separador: { color: C.textSubtle },
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
