import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorBanner, Field, FormHeader, PrimaryButton } from "@/components/ds";
import HeaderVoltar from "@/components/HeaderVoltar";
import * as AuthController from "@/controller/authController";
import { DS } from "@/global/themes";
import { usePerfilTutor } from "@/hooks/use-perfil-tutor";

const C = DS.colors;

export default function AlterarSenha() {
  const { perfil, carregando } = usePerfilTutor();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrar, setMostrar] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Conta criada só com Google ainda não tem senha: permite criar uma
  const possuiSenha = perfil?.possuiSenha ?? true;

  function olho(campo: keyof typeof mostrar) {
    return (
      <Pressable
        onPress={() => setMostrar((m) => ({ ...m, [campo]: !m[campo] }))}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={mostrar[campo] ? "Ocultar senha" : "Mostrar senha"}
      >
        <Ionicons
          name={mostrar[campo] ? "eye-off-outline" : "eye-outline"}
          size={DS.icon.sm}
          color={C.textSubtle}
        />
      </Pressable>
    );
  }

  async function salvar() {
    if (!perfil) return;
    setErro(null);
    setSalvando(true);

    const resultado = await AuthController.alterarSenha(
      perfil.email,
      possuiSenha,
      senhaAtual,
      novaSenha,
      confirmarSenha,
    );

    setSalvando(false);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem || "Não foi possível alterar a senha.");
      return;
    }

    Alert.alert(
      possuiSenha ? "Senha alterada" : "Senha criada",
      "Use a nova senha no seu próximo acesso.",
    );
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/perfil" as any);
    }
  }

  const titulo = possuiSenha ? "Alterar Senha" : "Criar Senha";

  if (carregando) {
    return (
      <SafeAreaView style={s.container}>
        <HeaderVoltar titulo="Senha" fallback="/perfil" />
        <View style={s.centro}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <HeaderVoltar titulo={titulo} disabled={salvando} fallback="/perfil" />

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
              icon="lock-closed-outline"
              eyebrow="Segurança da conta"
              title={possuiSenha ? "Alterar senha" : "Criar uma senha"}
              subtitle={
                possuiSenha
                  ? "Por segurança, confirme sua senha atual antes de definir a nova."
                  : "Sua conta usa o Google. Crie uma senha para também entrar com e-mail."
              }
            />

            {erro ? <ErrorBanner message={erro} /> : null}

            {possuiSenha ? (
              <Field
                label="Senha atual"
                icon="key-outline"
                value={senhaAtual}
                onChangeText={(v) => {
                  setSenhaAtual(v);
                  if (erro) setErro(null);
                }}
                placeholder="Digite sua senha atual"
                secureTextEntry={!mostrar.atual}
                autoCapitalize="none"
                autoComplete="current-password"
                editable={!salvando}
                rightSlot={olho("atual")}
              />
            ) : null}

            <Field
              label="Nova senha"
              icon="lock-closed-outline"
              value={novaSenha}
              onChangeText={(v) => {
                setNovaSenha(v);
                if (erro) setErro(null);
              }}
              placeholder="Mínimo de 6 caracteres"
              secureTextEntry={!mostrar.nova}
              autoCapitalize="none"
              autoComplete="new-password"
              editable={!salvando}
              rightSlot={olho("nova")}
            />

            <Field
              label="Confirmar nova senha"
              icon="shield-checkmark-outline"
              value={confirmarSenha}
              onChangeText={(v) => {
                setConfirmarSenha(v);
                if (erro) setErro(null);
              }}
              placeholder="Repita a nova senha"
              secureTextEntry={!mostrar.confirmar}
              autoCapitalize="none"
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={salvar}
              editable={!salvando}
              rightSlot={olho("confirmar")}
            />

            <View style={s.botao}>
              <PrimaryButton
                label={possuiSenha ? "Salvar nova senha" : "Criar senha"}
                iconRight="checkmark"
                onPress={salvar}
                loading={salvando}
                disabled={salvando || !perfil}
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
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formulario: { width: "100%", maxWidth: 480 },
  botao: { marginTop: 8 },
});
