import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorBanner, PrimaryButton } from "@/components/ds";
import * as AuthController from "@/controller/authController";
import { DS } from "@/global/themes";

WebBrowser.maybeCompleteAuthSession();

const C = DS.colors;

export default function AuthCallback() {
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function processarCallback() {
      const url =
        Platform.OS === "web" && typeof window !== "undefined"
          ? window.location.href
          : await Linking.getInitialURL();

      if (!url) {
        if (ativo) {
          setErro("Link de autenticação inválido ou expirado.");
        }
        return;
      }

      const resultado = await AuthController.concluirCallbackGoogle(url);
      if (!ativo) return;

      if (!resultado.sucesso) {
        setErro(
          resultado.mensagem || "Não foi possível concluir o login com Google.",
        );
        return;
      }

      router.replace("/(tabs)");
    }

    processarCallback();

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.conteudo}>
        {erro ? (
          <>
            <ErrorBanner message={erro} />
            <View style={s.acoes}>
              <PrimaryButton
                label="Voltar para o login"
                iconRight="arrow-forward"
                onPress={() => router.replace("/(auth)/login")}
              />
            </View>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.titulo}>Concluindo acesso com Google...</Text>
            <Text style={s.subtitulo}>
              Aguarde um instante enquanto preparamos sua conta.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  conteudo: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: 12,
  },
  titulo: {
    fontSize: 16,
    fontFamily: DS.font.semibold,
    color: C.text,
    textAlign: "center",
    marginTop: 4,
  },
  subtitulo: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    textAlign: "center",
  },
  acoes: {
    width: "100%",
    marginTop: 8,
  },
});
