import { useState } from "react";
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

import { supabase } from "@/lib/supabaseClient";
import { COLORS } from "@/global/themes";
import { PetSafeLogo } from "@/components/PetSafeLogo";

export default function RecuperarSenha() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [emailFocado, setEmailFocado] = useState(false);

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
            <Text style={style.headerNavText}>Voltar ao login</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          style={style.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={style.mainWrapper}>
            <View style={style.card}>
              <View style={style.iconCircle}>
                <Ionicons name="key-outline" size={22} color={COLORS.blue} />
              </View>

              <Text style={style.category}>RECUPERAÇÃO DE CONTA</Text>
              <Text style={style.title}>Esqueceu sua senha?</Text>
              <Text style={style.subtitle}>
                Digite seu e-mail cadastrado e enviaremos um link seguro para redefinir seu acesso.
              </Text>

              <View style={style.fieldWrapper}>
                <Text style={style.label}>E-mail cadastrado</Text>
                <View
                  style={[
                    style.inputBox,
                    emailFocado && style.inputBoxFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={17}
                    color={emailFocado ? COLORS.blue : "#94A3B8"}
                  />
                  <TextInput
                    style={style.input}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setEmailFocado(true)}
                    onBlur={() => setEmailFocado(false)}
                    placeholder="seu.email@exemplo.com"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!carregando}
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  style.primaryButton,
                  pressed && style.buttonPressed,
                  carregando && style.buttonDisabled,
                ]}
                onPress={recuperar}
                disabled={carregando}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={style.primaryButtonText}>Enviar link de redefinição</Text>
                    <Ionicons name="send" size={14} color="#FFFFFF" />
                  </>
                )}
              </Pressable>

              <View style={style.linkContainer}>
                <Text style={style.linkText}>Lembrou da senha?</Text>
                <Pressable onPress={() => router.replace("/(auth)/login")} hitSlop={6}>
                  <Text style={style.link}>Fazer login</Text>
                </Pressable>
              </View>
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
    marginBottom: 18,
  },
  fieldWrapper: {
    marginBottom: 16,
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
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 18,
  },
  linkText: {
    fontFamily: "Poppins_400Regular",
    fontSize: 12,
    color: "#6B7280",
  },
  link: {
    fontFamily: "Poppins_700Bold",
    fontSize: 12,
    color: COLORS.blue,
  },
});