import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { DS } from "@/global/themes";
import * as AuthController from "@/controller/authController";
import { GoogleFireworksButton } from "@/components/GoogleFireworksButton";
import {
  AuthLayout,
  ErrorBanner,
  Field,
  FeaturePanel,
  FooterLink,
  FormHeader,
  LabeledDivider,
  PrimaryButton,
} from "@/components/ds";

const C = DS.colors;

export default function Login() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar() {
    setErro(null);
    const emailLimpo = email.trim();

    if (!emailLimpo || !senha) {
      setErro("Informe seu e-mail e sua senha para continuar.");
      return;
    }

    setCarregando(true);
    const resultado = await AuthController.realizarLogin(emailLimpo, senha);
    setCarregando(false);

    if (!resultado.sucesso) {
      const msg = resultado.mensagem || "Erro ao realizar login. Verifique suas credenciais.";
      setErro(msg);
      Alert.alert("Erro ao entrar", msg);
      return;
    }

    router.replace("/(tabs)");
  }

  async function entrarComGoogle() {
    setErro(null);
    setCarregandoGoogle(true);
    const resultado = await AuthController.realizarLoginGoogle();
    setCarregandoGoogle(false);

    if (!resultado.sucesso) {
      if (resultado.mensagem && !resultado.mensagem.includes("cancelado")) {
        setErro(resultado.mensagem);
        Alert.alert("Login com Google", resultado.mensagem);
      }
      return;
    }

    router.replace("/(tabs)");
  }

  const ocupado = carregando || carregandoGoogle;
  const iconProps = { size: DS.icon.sm, color: C.cardText };

  return (
    <AuthLayout
      actionLabel="Criar conta"
      onActionPress={() => router.push("/(auth)/cadastro")}
      actionDisabled={ocupado}
      onLogoPress={() => {
        if (!isDesktop) router.push("/(auth)/onboarding");
      }}
      side={
        <FeaturePanel
          category="Tecnologia de identificação"
          title="Segurança inteligente e conectividade contínua para o seu pet."
          description="Plataforma integrada de identificação por medalhas inteligentes, histórico médico centralizado e localização em tempo real."
          items={[
            {
              icon: <Ionicons name="qr-code-outline" {...iconProps} />,
              title: "Medalha QR Code e NFC",
              description: "Acesso instantâneo aos dados do tutor, sem instalar aplicativos.",
            },
            {
              icon: <Ionicons name="navigate-outline" {...iconProps} />,
              title: "Notificação de leitura",
              description: "Alerta imediato com coordenadas quando a medalha for escaneada.",
            },
            {
              icon: <MaterialCommunityIcons name="clipboard-pulse-outline" {...iconProps} />,
              title: "Histórico veterinário digital",
              description: "Vacinação, antiparasitários e medicações sempre atualizados.",
            },
          ]}
          footer="Avaliação 4.9 de 5.0 por tutores em todo o país."
        />
      }
    >
      <FormHeader
        eyebrow="Acesso ao sistema"
        title="Entrar na conta"
        subtitle="Acesse para gerenciar medalhas e monitorar seus pets."
      />

      {erro ? <ErrorBanner message={erro} /> : null}

      <GoogleFireworksButton
        label="Continuar com o Google"
        onPress={entrarComGoogle}
        loading={carregandoGoogle}
        disabled={ocupado}
      />

      <LabeledDivider label="ou continue com e-mail" />

      <Field
        label="E-mail"
        icon="mail-outline"
        value={email}
        onChangeText={(val) => {
          setEmail(val);
          if (erro) setErro(null);
        }}
        placeholder="seu.email@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        editable={!ocupado}
      />

      <Field
        label="Senha"
        icon="lock-closed-outline"
        value={senha}
        onChangeText={(val) => {
          setSenha(val);
          if (erro) setErro(null);
        }}
        placeholder="Digite sua senha"
        secureTextEntry={!mostrarSenha}
        returnKeyType="go"
        onSubmitEditing={entrar}
        editable={!ocupado}
        labelRight={
          <Pressable
            onPress={() => router.push("/(auth)/recuperar_senha")}
            disabled={ocupado}
            hitSlop={6}
          >
            <Text style={s.linkMuted}>Esqueceu a senha?</Text>
          </Pressable>
        }
        rightSlot={
          <Pressable onPress={() => setMostrarSenha((prev) => !prev)} hitSlop={8}>
            <Ionicons
              name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
              size={DS.icon.sm}
              color={C.textSubtle}
            />
          </Pressable>
        }
      />

      <PrimaryButton
        label="Acessar conta"
        iconRight="arrow-forward"
        onPress={entrar}
        loading={carregando}
        disabled={ocupado}
        style={s.submit}
      />

      <FooterLink
        text="Ainda não tem conta?"
        link="Cadastre-se"
        onPress={() => router.push("/(auth)/cadastro")}
        disabled={ocupado}
      />
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  linkMuted: { fontSize: 12, fontFamily: DS.font.semibold, color: C.textMuted },
  submit: { marginTop: 8 },
});