import { useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import { supabase } from "@/lib/supabaseClient";
import {
  AuthLayout,
  Field,
  FooterLink,
  FormHeader,
  PrimaryButton,
} from "@/components/ds";

export default function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function recuperar() {
    const emailLimpo = email.trim();

    if (!emailLimpo) {
      Alert.alert("E-mail obrigatório", "Digite seu e-mail cadastrado.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, {
      redirectTo: "petsafe://redefinir_senha",
    });

    setCarregando(false);

    if (error) {
      Alert.alert("Erro ao recuperar", error.message);
      return;
    }

    Alert.alert(
      "E-mail enviado com sucesso",
      "Verifique sua caixa de entrada para instruções de redefinição de senha."
    );

    router.replace("/(auth)/login");
  }

  return (
    <AuthLayout
      actionLabel="Voltar ao login"
      onActionPress={() => router.replace("/(auth)/login")}
      onLogoPress={() => router.replace("/(auth)/login")}
      scroll={false}
      logoSize="sm"
    >
      <FormHeader
        icon="key-outline"
        eyebrow="Recuperação de conta"
        title="Esqueceu sua senha?"
        subtitle="Digite seu e-mail cadastrado e enviaremos um link seguro para redefinir seu acesso."
      />

      <Field
        label="E-mail cadastrado"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="seu.email@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!carregando}
      />

      <PrimaryButton
        label="Enviar link de redefinição"
        iconRight="send"
        onPress={recuperar}
        loading={carregando}
      />

      <FooterLink
        text="Lembrou da senha?"
        link="Fazer login"
        onPress={() => router.replace("/(auth)/login")}
      />
    </AuthLayout>
  );
}