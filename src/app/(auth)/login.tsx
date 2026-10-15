import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { COLORS } from "@/global/themes";
import * as AuthController from "@/controller/authController";
import { GoogleIcon } from "@/components/GoogleIcon";
import { PetSafeLogo } from "@/components/PetSafeLogo";

export default function Login() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoGoogle, setCarregandoGoogle] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Estados de foco dos campos
  const [emailFocado, setEmailFocado] = useState(false);
  const [senhaFocada, setSenhaFocada] = useState(false);

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

  return (
    <View style={style.container}>
      {/* Fundo Amarelo com Textura e Formas Borradas */}
      <View style={style.ambientBackground} pointerEvents="none">
        <View style={style.blurOrb1} />
        <View style={style.blurOrb2} />
        <View style={style.blurOrb3} />
      </View>

      <SafeAreaView style={style.safeArea}>
        {/* Barra superior minimalista com logo pura de texto (igual antes) */}
        <View style={[style.headerBar, isDesktop && style.headerBarDesktop]}>
          <Pressable
            onPress={() => {
              if (!isDesktop) {
                router.push("/(auth)/onboarding");
              }
            }}
            hitSlop={6}
          >
            <PetSafeLogo size="md" />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(auth)/cadastro")}
            disabled={ocupado}
            hitSlop={8}
            style={style.headerNavAction}
          >
            <Text style={style.headerNavText}>Criar conta</Text>
          </Pressable>
        </View>

        {/* Layout centralizado e compacto */}
        <KeyboardAvoidingView
          style={style.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={style.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={[style.mainWrapper, isDesktop && style.mainWrapperDesktop]}>
              {/* CARD DE LOGIN (Vercel / Geist Minimalist) */}
              <View style={[style.card, isDesktop && style.cardDesktop]}>
                <View style={style.cardHeader}>
                  <Text style={style.cardCategory}>ACESSO AO SISTEMA</Text>
                  <Text style={style.cardTitle}>Entrar na conta</Text>
                  <Text style={style.cardSubtitle}>
                    Acesse para gerenciar medalhas e monitorar seus pets.
                  </Text>
                </View>

                {/* Banner de Erro Visível no Card */}
                {erro ? (
                  <View style={style.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={style.errorBannerText}>{erro}</Text>
                  </View>
                ) : null}

                {/* Botão Google com ícone SVG */}
                <Pressable
                  style={({ pressed }) => [
                    style.googleButton,
                    pressed && style.buttonPressed,
                    ocupado && style.buttonDisabled,
                  ]}
                  onPress={entrarComGoogle}
                  disabled={ocupado}
                >
                  {carregandoGoogle ? (
                    <ActivityIndicator color="#4285F4" size="small" />
                  ) : (
                    <>
                      <GoogleIcon size={18} />
                      <Text style={style.googleButtonText}>Continuar com o Google</Text>
                    </>
                  )}
                </Pressable>

                {/* Divisor minimalista */}
                <View style={style.dividerContainer}>
                  <View style={style.dividerLine} />
                  <Text style={style.dividerText}>ou continue com e-mail</Text>
                  <View style={style.dividerLine} />
                </View>

                {/* Campo E-mail */}
                <View style={style.fieldWrapper}>
                  <Text style={style.inputLabel}>E-mail</Text>
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
                      style={style.textInput}
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (erro) setErro(null);
                      }}
                      onFocus={() => setEmailFocado(true)}
                      onBlur={() => setEmailFocado(false)}
                      placeholder="seu.email@exemplo.com"
                      placeholderTextColor="#94A3B8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      editable={!ocupado}
                    />
                  </View>
                </View>

                {/* Campo Senha */}
                <View style={style.fieldWrapper}>
                  <View style={style.senhaLabelRow}>
                    <Text style={style.inputLabel}>Senha</Text>
                    <Pressable
                      onPress={() => router.push("/(auth)/recuperar_senha")}
                      disabled={ocupado}
                      hitSlop={6}
                    >
                      <Text style={style.esqueciSenhaText}>Esqueceu a senha?</Text>
                    </Pressable>
                  </View>
                  <View
                    style={[
                      style.inputBox,
                      senhaFocada && style.inputBoxFocused,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={17}
                      color={senhaFocada ? COLORS.blue : "#94A3B8"}
                    />
                    <TextInput
                      style={style.textInput}
                      value={senha}
                      onChangeText={(val) => {
                        setSenha(val);
                        if (erro) setErro(null);
                      }}
                      onFocus={() => setSenhaFocada(true)}
                      onBlur={() => setSenhaFocada(false)}
                      placeholder="Digite sua senha"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!mostrarSenha}
                      returnKeyType="go"
                      onSubmitEditing={entrar}
                      editable={!ocupado}
                    />
                    <Pressable
                      onPress={() => setMostrarSenha((prev) => !prev)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={mostrarSenha ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color="#64748B"
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Botão Entrar Primário */}
                <Pressable
                  style={({ pressed }) => [
                    style.primaryButton,
                    pressed && style.buttonPressed,
                    ocupado && style.buttonDisabled,
                  ]}
                  onPress={entrar}
                  disabled={ocupado}
                >
                  {carregando ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={style.primaryButtonText}>Acessar conta</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>

                {/* Rodapé do Card */}
                <View style={style.cardFooterRow}>
                  <Text style={style.cardFooterText}>Ainda não tem conta?</Text>
                  <Pressable
                    onPress={() => router.push("/(auth)/cadastro")}
                    disabled={ocupado}
                    hitSlop={6}
                  >
                    <Text style={style.cardFooterLink}>Cadastre-se</Text>
                  </Pressable>
                </View>
              </View>

              {/* PAINEL LATERAL DESKTOP (Framer / Relume Component Showcase - Sem Emojis) */}
              {isDesktop && (
                <View style={style.desktopSidePanel}>
                  <View style={style.sideCard}>
                    <Text style={style.sideCategory}>TECNOLOGIA DE IDENTIFICAÇÃO</Text>
                    <Text style={style.sideTitle}>
                      Segurança inteligente e conectividade contínua para o seu pet.
                    </Text>
                    <Text style={style.sideDescription}>
                      Plataforma integrada de identificação por medalhas inteligentes, histórico médico centralizado e localização em tempo real.
                    </Text>

                    {/* Lista de Recursos com ícones vetoriais */}
                    <View style={style.featureList}>
                      <View style={style.featureItem}>
                        <View style={style.featureIconBox}>
                          <Ionicons name="qr-code-outline" size={18} color={COLORS.blue} />
                        </View>
                        <View style={style.featureTextBox}>
                          <Text style={style.featureTitle}>Medalha QR Code e NFC</Text>
                          <Text style={style.featureDesc}>
                            Acesso instantâneo aos dados do tutor sem necessidade de instalar aplicativos.
                          </Text>
                        </View>
                      </View>

                      <View style={style.featureItem}>
                        <View style={style.featureIconBox}>
                          <Ionicons name="navigate-outline" size={18} color={COLORS.blue} />
                        </View>
                        <View style={style.featureTextBox}>
                          <Text style={style.featureTitle}>Notificação de Leitura</Text>
                          <Text style={style.featureDesc}>
                            Alerta imediato com coordenadas geográficas quando a medalha for escaneada.
                          </Text>
                        </View>
                      </View>

                      <View style={style.featureItem}>
                        <View style={style.featureIconBox}>
                          <MaterialCommunityIcons name="clipboard-pulse-outline" size={18} color={COLORS.blue} />
                        </View>
                        <View style={style.featureTextBox}>
                          <Text style={style.featureTitle}>Histórico Veterinário Digital</Text>
                          <Text style={style.featureDesc}>
                            Controle de vacinação, antiparasitários e medicações sempre atualizados.
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Informação Institucional */}
                    <View style={style.socialProofBox}>
                      <View style={style.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons key={star} name="star" size={13} color="#F59E0B" />
                        ))}
                      </View>
                      <Text style={style.socialProofText}>
                        Avaliação 4.9 de 5.0 por tutores em todo o país.
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEB101",
    position: "relative",
  },
  ambientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#FEB101",
    overflow: "hidden",
  },
  blurOrb1: {
    position: "absolute",
    top: -60,
    left: -80,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#FFC526",
    opacity: 0.75,
    ...(Platform.OS === "web" ? ({ filter: "blur(70px)" } as any) : {}),
  },
  blurOrb2: {
    position: "absolute",
    bottom: -60,
    right: -80,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: "#E59800",
    opacity: 0.5,
    ...(Platform.OS === "web" ? ({ filter: "blur(80px)" } as any) : {}),
  },
  blurOrb3: {
    position: "absolute",
    top: "30%",
    right: "10%",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#FFE082",
    opacity: 0.6,
    ...(Platform.OS === "web" ? ({ filter: "blur(60px)" } as any) : {}),
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
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  mainWrapper: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    justifyContent: "center",
  },
  mainWrapperDesktop: {
    maxWidth: 980,
    flexDirection: "row",
    alignItems: "center",
    gap: 36,
  },

  // CARD DE LOGIN
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
  cardDesktop: {
    flex: 1,
    maxWidth: 440,
    padding: 28,
  },
  cardHeader: {
    marginBottom: 14,
  },
  cardCategory: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: "Poppins_700Bold",
    color: "#111827",
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    marginTop: 2,
    lineHeight: 18,
  },

  // BANNER DE ERRO
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#B91C1C",
    lineHeight: 16,
  },

  // GOOGLE BUTTON
  googleButton: {
    height: 42,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  googleButtonText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },

  // DIVISOR
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#9CA3AF",
  },

  // INPUTS
  fieldWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: "#374151",
    marginBottom: 4,
  },
  senhaLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  esqueciSenhaText: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.blue,
  },
  inputBox: {
    height: 44,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  inputBoxFocused: {
    borderColor: COLORS.blue,
    backgroundColor: "#FFFFFF",
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#111827",
  },

  // BOTÃO PRIMÁRIO
  primaryButton: {
    height: 44,
    backgroundColor: COLORS.blue,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // FOOTER DO CARD
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 16,
  },
  cardFooterText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
  },
  cardFooterLink: {
    fontSize: 12,
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },

  // PAINEL LATERAL DESKTOP
  desktopSidePanel: {
    flex: 1,
    justifyContent: "center",
  },
  sideCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 6,
  },
  sideCategory: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  sideTitle: {
    fontSize: 22,
    fontFamily: "Poppins_700Bold",
    color: "#111827",
    lineHeight: 30,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  sideDescription: {
    fontSize: 13,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    lineHeight: 20,
    marginBottom: 20,
  },
  featureList: {
    gap: 14,
    marginBottom: 22,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(29, 30, 100, 0.06)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#111827",
    marginBottom: 1,
  },
  featureDesc: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
    lineHeight: 16,
  },
  socialProofBox: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  socialProofText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
  },
});