import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { DS } from "@/global/themes";
import * as AuthController from "@/controller/authController";
import { GoogleFireworksButton } from "@/components/GoogleFireworksButton";
import {
  AuthLayout,
  ErrorBanner,
  FeaturePanel,
  Field,
  FooterLink,
  FormHeader,
  LabeledDivider,
  PrimaryButton,
} from "@/components/ds";

const C = DS.colors;

export default function Cadastro() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucessoCriacao, setSucessoCriacao] = useState(false);

  async function cadastrar() {
    setErro(null);

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim();

    if (!nomeLimpo || !emailLimpo || !senha || !confirmarSenha) {
      setErro("Preencha todos os campos para criar sua conta.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas informadas não coincidem.");
      return;
    }

    setCarregando(true);
    const resultado = await AuthController.realizarCadastro(
      nomeLimpo,
      emailLimpo,
      senha,
      confirmarSenha
    );
    setCarregando(false);

    if (!resultado.sucesso) {
      const msg = resultado.mensagem || "Erro ao realizar cadastro. Tente novamente.";
      setErro(msg);
      Alert.alert("Erro ao criar conta", msg);
      return;
    }

    if (resultado.possuiSessao) {
      router.replace("/(tabs)");
      return;
    }

    // Se o Supabase exigir confirmação por e-mail
    setSucessoCriacao(true);
  }

  async function cadastrarComGoogle() {
    setErro(null);
    setCarregandoGoogle(true);
    const resultado = await AuthController.realizarLoginGoogle();
    setCarregandoGoogle(false);

    if (!resultado.sucesso) {
      if (resultado.mensagem && !resultado.mensagem.includes("cancelado")) {
        setErro(resultado.mensagem);
        Alert.alert("Cadastro com Google", resultado.mensagem);
      }
      return;
    }

    router.replace("/(tabs)");
  }

  const ocupado = carregando || carregandoGoogle;
  const iconProps = { size: DS.icon.sm, color: C.cardText };

  const olho = (visivel: boolean, alternar: () => void) => (
    <Pressable onPress={alternar} hitSlop={8}>
      <Ionicons
        name={visivel ? "eye-off-outline" : "eye-outline"}
        size={DS.icon.sm}
        color={C.textSubtle}
      />
    </Pressable>
  );

  return (
    <AuthLayout
      actionLabel="Fazer login"
      onActionPress={() => router.push("/(auth)/login")}
      actionDisabled={ocupado}
      onLogoPress={() => {
        if (!isDesktop) {
          router.push("/(auth)/onboarding");
        } else {
          router.push("/(auth)/login");
        }
      }}
      side={
        <FeaturePanel
          category="Benefícios da plataforma"
          title="Tudo o que seu pet precisa para viver protegido e seguro."
          description="Transforme a rotina de cuidados do seu animal com ferramentas avançadas de identificação e assistência veterinária."
          items={[
            {
              icon: <Ionicons name="flash-outline" {...iconProps} />,
              title: "Configuração em 60 segundos",
              description: "Ativação rápida de medalhas inteligentes com perfil público completo.",
            },
            {
              icon: <Ionicons name="notifications-outline" {...iconProps} />,
              title: "Avisos instantâneos",
              description:
                "Notificação imediata no app e e-mail no instante em que a medalha for escaneada.",
            },
            {
              icon: <MaterialCommunityIcons name="heart-pulse" {...iconProps} />,
              title: "Lembretes preventivos",
              description: "Calendário de vacinação, antipulgas e vermífugos automatizado.",
            },
          ]}
          footer="Mais de 15.000 tutores ativos em todo o Brasil."
        />
      }
    >
      {sucessoCriacao ? (
        /* Confirmação quando o e-mail precisa ser verificado */
        <View>
          <FormHeader
            icon="mail-unread-outline"
            title="Verifique seu e-mail"
            subtitle="Por favor, acesse seu e-mail e clique no link de ativação para poder entrar na sua conta."
          />
          <Text style={s.successText}>
            Enviamos um link de confirmação para <Text style={s.boldEmail}>{email}</Text>.
          </Text>
          <PrimaryButton
            label="Ir para o login"
            iconRight="arrow-forward"
            onPress={() => router.replace("/(auth)/login")}
          />
        </View>
      ) : (
        <>
          <FormHeader
            eyebrow="Nova conta"
            title="Criar conta PetSafe"
            subtitle="Cadastre-se para vincular medalhas e proteger seu pet."
          />

          {erro ? <ErrorBanner message={erro} /> : null}

          <GoogleFireworksButton
            label="Criar conta com o Google"
            onPress={cadastrarComGoogle}
            loading={carregandoGoogle}
            disabled={ocupado}
          />

          <LabeledDivider label="ou cadastre-se com e-mail" />

          <Field
            label="Nome completo"
            icon="person-outline"
            value={nome}
            onChangeText={(val) => {
              setNome(val);
              if (erro) setErro(null);
            }}
            placeholder="Seu nome completo"
            autoCapitalize="words"
            returnKeyType="next"
            editable={!ocupado}
          />

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
            placeholder="Mínimo 6 caracteres"
            secureTextEntry={!mostrarSenha}
            returnKeyType="next"
            editable={!ocupado}
            rightSlot={olho(mostrarSenha, () => setMostrarSenha((prev) => !prev))}
          />

          <Field
            label="Confirmar senha"
            icon="shield-checkmark-outline"
            value={confirmarSenha}
            onChangeText={(val) => {
              setConfirmarSenha(val);
              if (erro) setErro(null);
            }}
            placeholder="Repita sua senha"
            secureTextEntry={!mostrarConfirmarSenha}
            returnKeyType="done"
            onSubmitEditing={cadastrar}
            editable={!ocupado}
            rightSlot={olho(mostrarConfirmarSenha, () =>
              setMostrarConfirmarSenha((prev) => !prev)
            )}
          />

          <Text style={s.termsText}>
            Ao criar sua conta você concorda com nossos <Text style={s.termsLink}>Termos</Text> e{" "}
            <Text style={s.termsLink}>Privacidade</Text>.
          </Text>

          <PrimaryButton
            label="Criar conta gratuita"
            iconRight="arrow-forward"
            onPress={cadastrar}
            loading={carregando}
            disabled={ocupado}
          />

          <FooterLink
            text="Já possui cadastro?"
            link="Entrar"
            onPress={() => router.push("/(auth)/login")}
            disabled={ocupado}
          />
        </>
      )}
    </AuthLayout>
  );
}

const s = StyleSheet.create({
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    marginBottom: 20,
  },
  termsLink: { fontFamily: DS.font.semibold, color: C.text },
  successText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    marginBottom: 24,
  },
  boldEmail: { fontFamily: DS.font.bold, color: C.text },
});