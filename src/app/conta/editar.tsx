import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import HeaderVoltar from "@/components/HeaderVoltar";
import * as AuthController from "@/controller/authController";
import { DS } from "@/global/themes";
import { usePerfilTutor } from "@/hooks/use-perfil-tutor";
import { ArquivoSelecionado } from "@/services/petMidia";

const C = DS.colors;

// Máscara (DD) 9999-9999 / (DD) 99999-9999 enquanto a pessoa digita
function mascararTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function EditarPerfil() {
  const { perfil, carregando, erro: erroCarregar, recarregar } = usePerfilTutor();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [fotoAtualUrl, setFotoAtualUrl] = useState<string | null>(null);
  const [novaFoto, setNovaFoto] = useState<ArquivoSelecionado | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Preenche o formulário uma única vez com os dados reais do tutor
  const preenchido = useRef(false);
  useEffect(() => {
    if (!perfil || preenchido.current) return;
    preenchido.current = true;
    setNome(perfil.nome === "Usuário" ? "" : perfil.nome);
    setTelefone(mascararTelefone(perfil.telefone ?? ""));
    setEmail(perfil.email);
    setFotoAtualUrl(perfil.fotoPerfilUrl ?? null);
  }, [perfil]);

  function limparErro() {
    if (erro) setErro(null);
  }

  async function escolherFoto() {
    setErro(null);
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) setNovaFoto(res.assets[0]);
  }

  function removerFoto() {
    setNovaFoto(null);
    setFotoAtualUrl(null);
  }

  async function salvar() {
    if (!perfil) return;
    setErro(null);
    setSalvando(true);

    const resultado = await AuthController.salvarPerfil({
      nome,
      telefone,
      email,
      emailAtual: perfil.email,
      fotoAtualUrl,
      novaFoto,
    });

    setSalvando(false);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem || "Não foi possível salvar seu perfil.");
      return;
    }

    // Volta para o perfil (que recarrega ao ganhar foco). O aviso não depende
    // de botão, pois Alert.alert não exibe nada na versão web.
    Alert.alert(
      "Perfil atualizado",
      resultado.emailPendente
        ? `Enviamos um link de confirmação para ${email.trim()} (e, se for exigido, também para o e-mail atual). Seu e-mail só será alterado depois da confirmação.`
        : "Suas informações foram salvas com sucesso.",
    );
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/perfil" as any);
    }
  }

  const fotoExibida = novaFoto?.uri ?? fotoAtualUrl;

  if (carregando) {
    return (
      <SafeAreaView style={s.container}>
        <HeaderVoltar titulo="Editar Perfil" fallback="/perfil" />
        <View style={s.centro}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!perfil) {
    return (
      <SafeAreaView style={s.container}>
        <HeaderVoltar titulo="Editar Perfil" fallback="/perfil" />
        <View style={s.centro}>
          <ErrorBanner message={erroCarregar || "Não foi possível carregar seu perfil."} />
          <Pressable onPress={recarregar} hitSlop={8}>
            <Text style={s.link}>Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <HeaderVoltar titulo="Editar Perfil" disabled={salvando} fallback="/perfil" />

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
              eyebrow="Informações pessoais"
              title="Editar perfil"
              subtitle="Mantenha seus dados atualizados para proteger sua conta."
            />

            {erro ? <ErrorBanner message={erro} /> : null}

            {/* FOTO DE PERFIL */}
            <View style={s.fotoArea}>
              <Pressable
                onPress={escolherFoto}
                disabled={salvando}
                style={({ pressed }) => [s.fotoBox, pressed && s.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Alterar foto de perfil"
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
                    <Text style={s.fotoAcaoTexto}>Trocar foto</Text>
                  </Pressable>
                  <Text style={s.fotoAcaoSeparador}>·</Text>
                  <Pressable onPress={removerFoto} disabled={salvando} hitSlop={8}>
                    <Text style={s.fotoAcaoTexto}>Remover foto</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>

            <Field
              label="Nome completo"
              icon="person-outline"
              value={nome}
              onChangeText={(v) => {
                setNome(v);
                limparErro();
              }}
              placeholder="Seu nome completo"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              editable={!salvando}
            />

            <Field
              label="Telefone"
              icon="call-outline"
              value={telefone}
              onChangeText={(v) => {
                setTelefone(mascararTelefone(v));
                limparErro();
              }}
              placeholder="(63) 99999-9999"
              keyboardType="phone-pad"
              autoComplete="tel"
              returnKeyType="next"
              editable={!salvando}
            />

            <Field
              label="E-mail"
              icon="mail-outline"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                limparErro();
              }}
              placeholder="seu.email@exemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={salvar}
              editable={!salvando}
            />

            <View style={s.aviso}>
              <Ionicons name="lock-closed-outline" size={16} color={C.textMuted} />
              <Text style={s.avisoTexto}>
                Esses dados são privados e não aparecem para quem escanear a medalha
                do seu pet. Ao trocar o e-mail, enviaremos um link de confirmação para
                o novo endereço.
              </Text>
            </View>

            <View style={s.botao}>
              <PrimaryButton
                label="Salvar alterações"
                iconRight="checkmark"
                onPress={salvar}
                loading={salvando}
                disabled={salvando}
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
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  link: { fontSize: 14, fontFamily: DS.font.semibold, color: C.primary },
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
  fotoAcaoTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.textMuted,
  },
  fotoAcaoSeparador: { color: C.textSubtle },
  aviso: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avisoTexto: {
    flex: 1,
    fontSize: 12,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    lineHeight: 18,
  },
  botao: { marginTop: 8 },
});
