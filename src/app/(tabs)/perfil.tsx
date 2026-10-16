import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { DS } from "@/global/themes";
import { supabase } from "@/lib/supabaseClient";
import * as AuthController from "@/controller/authController";
import { HighlightCard, Divider } from "@/components/ds";

const C = DS.colors;

export default function Perfil() {
  const [carregando, setCarregando] = useState(false);
  const [nome, setNome] = useState("Usuário");
  const [email, setEmail] = useState("");

  useEffect(() => {
    let ativo = true;
    AuthController.carregarUsuarioAtual()
      .then((usuario) => {
        if (!ativo || !usuario) return;
        if (usuario.nome) setNome(usuario.nome);
        if (usuario.email) setEmail(usuario.email);
      })
      .catch(() => {
        // Mantém fallback
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function sair() {
    try {
      setCarregando(true);
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    } catch {
      Alert.alert("Erro", "Não foi possível encerrar a sessão.");
    } finally {
      setCarregando(false);
    }
  }

  const inicial = nome.trim().charAt(0).toUpperCase() || "U";

  return (
    <SafeAreaView style={style.container}>
      <View style={style.header}>
        <Text style={style.title}>Meu Perfil</Text>
      </View>

      <View style={style.content}>
        {/* Único card de destaque da tela */}
        <HighlightCard style={style.profileCard}>
          <View style={style.avatar}>
            <Text style={style.avatarText}>{inicial}</Text>
          </View>
          <Text style={style.profileName} numberOfLines={1}>
            {nome}
          </Text>
          {email ? (
            <Text style={style.profileEmail} numberOfLines={1}>
              {email}
            </Text>
          ) : null}
        </HighlightCard>

        <View style={style.spacer} />

        <Divider />
        <Pressable
          style={({ pressed }) => [
            style.logoutRow,
            pressed && style.pressed,
            carregando && style.buttonDisabled,
          ]}
          onPress={sair}
          disabled={carregando}
        >
          <Ionicons name="log-out-outline" size={DS.icon.md} color={C.danger} />
          <Text style={style.logoutText}>
            {carregando ? "Saindo..." : "Sair da Conta"}
          </Text>
        </Pressable>
        <Divider />
      </View>
    </SafeAreaView>
  );
}

export const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: DS.font.bold,
    color: C.text,
    letterSpacing: -0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: DS.font.bold,
    color: C.cardText,
  },
  profileName: {
    fontSize: 20,
    fontFamily: DS.font.bold,
    fontWeight: "700",
    color: C.cardText,
    letterSpacing: -0.4,
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.cardTextMuted,
    marginTop: 4,
  },
  spacer: {
    flex: 1,
  },
  logoutRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
  },
  pressed: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  logoutText: {
    color: C.danger,
    fontFamily: DS.font.semibold,
    fontSize: 15,
  },
});
