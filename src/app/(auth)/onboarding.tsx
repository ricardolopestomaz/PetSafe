import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "@/global/themes";
import { PetSafeLogo } from "@/components/PetSafeLogo";
import { isAppOrMobileDevice } from "@/lib/device";

// Imagens originais do onboarding cobrindo a tela
const slides = [
  {
    image: require("../../assets/images/onboarding-dog-1.png"),
    title: "Encontre seu pet com facilidade",
    description:
      "Com a medalhinha PetSafe, quem encontrar seu pet poderá acessar suas informações e entrar em contato com você.",
  },
  {
    image: require("../../assets/images/onboarding-cat-1.png"),
    title: "Localização em tempo real",
    description:
      "Receba no smartphone o local exato com coordenadas no momento em que a medalha QR Code ou NFC for lida.",
  },
  {
    image: require("../../assets/images/onboarding-dog-2.png"),
    title: "Vacinas e consultas organizadas",
    description:
      "Mantenha carteira de vacinação digital, controle de vermífugos e dados do veterinário sempre acessíveis.",
  },
  {
    image: require("../../assets/images/onboarding-cat-2.png"),
    title: "Proteção completa para o seu amigo",
    description:
      "Conecte-se a uma rede moderna de tutores para garantir o bem-estar e a tranquilidade de quem você ama.",
  },
];

export default function Onboarding() {
  const router = useRouter();

  // O Onboarding só deve aparecer se for no APP / CELULAR
  const isMobile = isAppOrMobileDevice();

  useEffect(() => {
    if (!isMobile) {
      router.replace("/(auth)/login");
    }
  }, [isMobile, router]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Sem mudança automática: o slide só muda quando o usuário clica em "Continuar"
  function handleContinuar() {
    if (currentIndex < slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      router.replace("/(auth)/login");
    }
  }

  // Se estiver em ambiente desktop/notebook, não renderiza o onboarding e redireciona
  if (!isMobile) {
    return null;
  }

  const slideAtual = slides[currentIndex];

  return (
    <View style={style.container}>
      {/* Imagem de Fundo Cobrindo Toda a Tela */}
      <Image
        source={slideAtual.image}
        style={style.image}
        resizeMode="cover"
      />

      <SafeAreaView style={style.safeArea} pointerEvents="box-none">
        {/* Botão Superior "Pular" */}
        <View style={style.topBar}>
          <Pressable
            style={style.skipBadge}
            onPress={() => router.replace("/(auth)/login")}
            hitSlop={8}
          >
            <Text style={style.skipText}>Pular</Text>
          </Pressable>
        </View>

        {/* Card Inferior Mobile */}
        <View style={style.card}>
          {/* Logo Original de Texto sem Ícone ao Lado */}
          <PetSafeLogo size="md" style={style.logoMargin} />

          {/* Indicadores de Slide */}
          <View style={style.indicatorsRow}>
            {slides.map((_, index) => (
              <View
                key={index}
                style={[
                  style.indicator,
                  index === currentIndex && style.activeIndicator,
                ]}
              />
            ))}
          </View>

          {/* Título e Descrição do Slide */}
          <Text style={style.title}>{slideAtual.title}</Text>
          <Text style={style.description}>{slideAtual.description}</Text>

          {/* Botão de Avançar Manual - muda SOMENTE ao clicar em Continuar */}
          <Pressable
            style={({ pressed }) => [
              style.primaryButton,
              pressed && style.buttonPressed,
            ]}
            onPress={handleContinuar}
          >
            <Text style={style.primaryButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </Pressable>

          {/* Link para Login */}
          <Pressable
            onPress={() => router.replace("/(auth)/login")}
            hitSlop={6}
            style={style.secondaryLink}
          >
            <Text style={style.secondaryLinkText}>
              Já tem uma conta? <Text style={style.secondaryLinkBold}>Entrar</Text>
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FEB101",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skipBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.06)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  skipText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: "#1F2937",
  },
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 36,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  logoMargin: {
    marginBottom: 10,
  },
  indicatorsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
  },
  activeIndicator: {
    backgroundColor: COLORS.yellow,
    width: 20,
  },
  title: {
    color: "#111827",
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  description: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  primaryButton: {
    width: "100%",
    height: 46,
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Poppins_600SemiBold",
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  secondaryLink: {
    marginTop: 14,
  },
  secondaryLinkText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#6B7280",
  },
  secondaryLinkBold: {
    fontFamily: "Poppins_700Bold",
    color: COLORS.blue,
  },
});
