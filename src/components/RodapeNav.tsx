import {
  FontAwesome5,
  Ionicons,
  Octicons
} from "@expo/vector-icons";

import { router } from "expo-router";

import { StyleSheet, TouchableOpacity, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { COLORS, DS } from "@/global/themes";

// Abas disponíveis no rodapé
export type RodapeAba = "home" | "scanner" | "mapa" | "chat" | "perfil";

type RodapeNavProps = {
  abaAtiva?: RodapeAba;
  onSelecionarAba?: (aba: RodapeAba) => void;
};

export default function RodapeNav({
  abaAtiva = "scanner",
  onSelecionarAba,
}: RodapeNavProps) {
  const insets = useSafeAreaInsets();

  const paddingBottomCalculado = Math.max(insets.bottom, 10);

  // Navegação entre as abas
  function navegar(aba: RodapeAba) {
    if (onSelecionarAba) {
      onSelecionarAba(aba);
    }

    if (aba === abaAtiva) return;

    switch (aba) {
      case "home":
        router.push("/(tabs)" as any);
        break;

      case "scanner":
        router.push("/scanner" as any);
        break;

      case "mapa":
        router.push("/mapa" as any);
        break;

      case "chat":
        router.push("/chat" as any);
        break;

      case "perfil":
        router.push("/perfil" as any);
        break;
    }
  }

  return (
    <View
      style={[
        styles.rodape,
        {
          paddingBottom: paddingBottomCalculado,
          height: 60 + paddingBottomCalculado,
        },
      ]}
    >
      {/* 1. INÍCIO */}
      <TouchableOpacity
        style={styles.itemRodape}
        onPress={() => navegar("home")}
        accessibilityLabel="Início"
        accessibilityRole="tab"
        accessibilityState={{
          selected: abaAtiva === "home",
        }}
      >
        <Octicons
          name="home"
          size={20}
          color={abaAtiva === "home" ? COLORS.yellow : COLORS.cinzaclaro}
        />

        {abaAtiva === "home" && <View style={styles.tracoAtivo} />}
      </TouchableOpacity>

      {/* 2. MAPA DOS PETS */}
      <TouchableOpacity
        style={styles.itemRodape}
        onPress={() => navegar("mapa")}
        accessibilityLabel="Mapa de localização dos pets"
        accessibilityRole="tab"
        accessibilityState={{
          selected: abaAtiva === "mapa",
        }}
      >
        <FontAwesome5
          name="map"
          size={20}
          color={abaAtiva === "mapa" ? COLORS.yellow : COLORS.cinzaclaro}
        />

        {abaAtiva === "mapa" && <View style={styles.tracoAtivo} />}
      </TouchableOpacity>

      {/* 3. SCANNER QR CODE */}
      <TouchableOpacity
        style={styles.itemRodape}
        onPress={() => navegar("scanner")}
        accessibilityLabel="Scanner de QR Code"
        accessibilityRole="tab"
        accessibilityState={{
          selected: abaAtiva === "scanner",
        }}
      >
        <Ionicons
          name={abaAtiva === "scanner" ? "qr-code" : "qr-code-outline"}
          size={20}
          color={abaAtiva === "scanner" ? COLORS.yellow : COLORS.cinzaclaro}
        />

        {abaAtiva === "scanner" && <View style={styles.tracoAtivo} />}
      </TouchableOpacity>

      {/* 4. CHAT */}
      <TouchableOpacity
        style={styles.itemRodape}
        onPress={() => navegar("chat")}
        accessibilityLabel="Mensagens"
        accessibilityRole="tab"
        accessibilityState={{
          selected: abaAtiva === "chat",
        }}
      >
        <Ionicons
          name="chatbubbles-outline"
          size={20}
          color={abaAtiva === "chat" ? COLORS.yellow : COLORS.cinzaclaro}
        />

        {abaAtiva === "chat" && <View style={styles.tracoAtivo} />}
      </TouchableOpacity>

      {/* 5. MEU PERFIL */}
      <TouchableOpacity
        style={styles.itemRodape}
        onPress={() => navegar("perfil")}
        accessibilityLabel="Meu perfil"
        accessibilityRole="tab"
        accessibilityState={{
          selected: abaAtiva === "perfil",
        }}
      >
        <FontAwesome5
          name="user-circle"
          size={20}
          color={abaAtiva === "perfil" ? COLORS.yellow : COLORS.cinzaclaro}
        />

        {abaAtiva === "perfil" && <View style={styles.tracoAtivo} />}
      </TouchableOpacity>
    </View>
  );
}

// Estilização
const styles = StyleSheet.create({
  rodape: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: DS.colors.bg,
    borderTopColor: DS.colors.divider,
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 99,
  },

  itemRodape: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    position: "relative",
  },

  tracoAtivo: {
    position: "absolute",
    bottom: -8,
    width: 16,
    height: 3,
    backgroundColor: COLORS.yellow,
    borderRadius: 2,
  },
});
