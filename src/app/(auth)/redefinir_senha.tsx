import { useEffect, useState } from "react";
import { Alert, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import * as AuthController from "@/controller/authController";
import { supabase } from "@/lib/supabaseClient";
import { DS } from "@/global/themes";
import { AuthLayout, Field, FormHeader, PrimaryButton } from "@/components/ds";

export default function RedefinirSenha() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/(auth)/login");
      }
    });
  }, []);

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
          router.replace("/(auth)/login");
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
      onActionPress={() => router.replace("/(auth)/login")}
      onLogoPress={() => router.replace("/(auth)/login")}
      scroll={false}
      logoSize="sm"
    >
      <FormHeader
        icon="lock-closed-outline"
        eyebrow="Segurança da conta"
        title="Criar nova senha"
        subtitle="Digite e confirme sua nova senha para proteger seu acesso."
      />

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
      />
    </AuthLayout>
  );
}