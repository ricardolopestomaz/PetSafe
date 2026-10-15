import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import * as AuthController from "@/controller/authController";
import { supabase } from "@/lib/supabaseClient";
import { COLORS } from "@/global/themes";
import { PetSafeLogo } from "@/components/PetSafeLogo";

export default function RedefinirSenha() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [novaSenhaFocada, setNovaSenhaFocada] = useState(false);
  const [confirmarSenhaFocada, setConfirmarSenhaFocada] = useState(false);

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

  return (
    <View style={style.container}>
      <SafeAreaView style={style.safeArea}>
        {/* Top Navbar */}
        <View style={[style.headerBar, isDesktop && style.headerBarDesktop]}>
          <Pressable onPress={() => router.replace("/(auth)/login")}>
            <PetSafeLogo size="sm" variant="horizontal" />
          </Pressable>

          <Pressable
            onPress={() => router.replace("/(auth)/login")}
            hitSlop={8}
            style={style.headerNavAction}
          >
            <Text style={style.headerNavText}>Cancelar</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={style.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={style.mainWrapper}>
            <View style={style.card}>
              <View style={style.iconCircle}>
                <Ionicons name="lock-closed" size={22} color={COLORS.blue} />
              </View>

              <Text style={style.category}>SEGURANÇA DA CONTA</Text>
              <Text style={style.title}>Criar nova senha</Text>
              <Text style={style.subtitle}>
                Digite e confirme sua nova senha para proteger seu acesso.
              </Text>

              {/* Campo Nova Senha */}
              <View style={style.fieldWrapper}>
                <Text style={style.label}>Nova senha</Text>
                <View
                  style={[
                    style.inputBox,
                    novaSenhaFocada && style.inputBoxFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={17}
                    color={novaSenhaFocada ? COLORS.blue : "#94A3B8"}
                  />
                  <TextInput
                    style={style.input}
                    value={novaSenha}
                    onChangeText={setNovaSenha}
                    onFocus={() => setNovaSenhaFocada(true)}
                    onBlur={() => setNovaSenhaFocada(false)}
                    placeholder="Mínimo de 6 caracteres"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!mostrarNovaSenha}
                    editable={!carregando}
                  />
                  <Pressable
                    onPress={() => setMostrarNovaSenha((prev) => !prev)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={mostrarNovaSenha ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#64748B"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Campo Confirmar Senha */}
              <View style={style.fieldWrapper}>
                <Text style={style.label}>Confirmar nova senha</Text>
                <View
                  style={[
                    style.inputBox,
                    confirmarSenhaFocada && style.inputBoxFocused,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={17}
                    color={confirmarSenhaFocada ? COLORS.blue : "#94A3B8"}
                  />
                  <TextInput
                    style={style.input}
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    onFocus={() => setConfirmarSenhaFocada(true)}
                    onBlur={() => setConfirmarSenhaFocada(false)}
                    placeholder="Repita sua nova senha"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!mostrarConfirmarSenha}
                    editable={!carregando}
                  />
                  <Pressable
                    onPress={() => setMostrarConfirmarSenha((prev) => !prev)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={mostrarConfirmarSenha ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#64748B"
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  style.primaryButton,
                  pressed && style.buttonPressed,
                  carregando && style.buttonDisabled,
                ]}
                onPress={redefinir}
                disabled={carregando}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={style.primaryButtonText}>Salvar nova senha</Text>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  headerBarDesktop: {
    paddingHorizontal: 48,
    paddingVertical: 14,
  },
  headerNavAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  headerNavText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 26,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(29, 30, 100, 0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  category: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: "Poppins_700Bold",
    fontSize: 20,
    color: "#111827",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  fieldWrapper: {
    marginBottom: 12,
  },
  label: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 11,
    color: "#374151",
    marginBottom: 4,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: "#FAFAFA",
    gap: 8,
  },
  inputBoxFocused: {
    borderColor: COLORS.blue,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    fontFamily: "Poppins_400Regular",
    fontSize: 13,
    color: "#111827",
  },
  primaryButton: {
    height: 44,
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  primaryButtonText: {
    fontFamily: "Poppins_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});