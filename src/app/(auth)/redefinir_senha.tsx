import { useEffect, useState } from "react";
import { Alert, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import * as AuthController from "@/controller/authController";
import { finalizarRecuperacaoSenha } from "@/lib/recuperacaoSenha";
import { supabase } from "@/lib/supabaseClient";
import { DS } from "@/global/themes";
import {
  AuthLayout,
  ErrorBanner,
  Field,
  FormHeader,
  PrimaryButton,
} from "@/components/ds";

export default function RedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  // null = verificando; a sessão pode chegar alguns instantes depois
  // (o deep link é processado em paralelo quando o app abre pelo e-mail)
  const [temSessao, setTemSessao] = useState<boolean | null>(null);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (ativo) setTemSessao(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {
        if (ativo) setTemSessao(Boolean(sessao));
      },
    );

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function cancelar() {
    // Encerra a sessão temporária da recuperação e volta ao login
    finalizarRecuperacaoSenha();
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  }

  async function redefinir() {
    setCarregando(true);
    const resultado = await AuthController.realizarRedefinicaoSenha(
      novaSenha,
      confirmarSenha,
    );
    setCarregando(false);

    if (!resultado.sucesso) {
      Alert.alert("Erro ao redefinir senha", resultado.mensagem);
      return;
    }

    Alert.alert("Senha redefinida", "Sua senha foi alterada com sucesso.", [
      {
        text: "OK",
        onPress: () => {
          // Recuperação concluída: o usuário já está logado com a nova senha
          finalizarRecuperacaoSenha();
          router.replace("/(tabs)");
        },
      },
    ]);
  }

  const olho = (visivel: boolean, alternar: () => void) => (
    <Pressable onPress={alternar} hitSlop={8}>
      <Ionicons
        name={visivel ? "eye-off-outline" : "eye-outline"}
        size={DS.icon.sm}
        color={DS.colors.textSubtle}
      />
    </Pressable>
  );

  return (
    <AuthLayout
      actionLabel="Cancelar"
      onActionPress={cancelar}
      onLogoPress={cancelar}
      scroll={false}
      logoSize="sm"
    >
      <FormHeader
        icon="lock-closed-outline"
        eyebrow="Segurança da conta"
        title="Criar nova senha"
        subtitle="Digite e confirme sua nova senha para proteger seu acesso."
      />

      {temSessao === false ? (
        <ErrorBanner message="Link de redefinição inválido ou expirado. Volte ao login e solicite um novo link." />
      ) : null}

      <Field
        label="Nova senha"
        icon="lock-closed-outline"
        value={novaSenha}
        onChangeText={setNovaSenha}
        placeholder="Mínimo de 6 caracteres"
        secureTextEntry={!mostrarNovaSenha}
        editable={!carregando}
        rightSlot={olho(mostrarNovaSenha, () => setMostrarNovaSenha((prev) => !prev))}
      />

      <Field
        label="Confirmar nova senha"
        icon="shield-checkmark-outline"
        value={confirmarSenha}
        onChangeText={setConfirmarSenha}
        placeholder="Repita sua nova senha"
        secureTextEntry={!mostrarConfirmarSenha}
        editable={!carregando}
        rightSlot={olho(mostrarConfirmarSenha, () =>
          setMostrarConfirmarSenha((prev) => !prev)
        )}
      />

      <PrimaryButton
        label="Salvar nova senha"
        iconRight="checkmark"
        onPress={redefinir}
        loading={carregando}
        disabled={!temSessao}
      />
    </AuthLayout>
  );
}