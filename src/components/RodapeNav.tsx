import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";

import { COLORS } from "@/global/themes";

export type RodapeAba = "home" | "ai" | "scanner" | "chat" | "pets";

type RodapeNavProps = {
  abaAtiva?: RodapeAba;
  onSelecionarAba?: (aba: RodapeAba) => void;
};

export default function RodapeNav({
  abaAtiva = "scanner",
  onSelecionarAba,
}: RodapeNavProps) {
  const insets = useSafeAreaInsets();
  const paddingBottomCalculado = Math.max(insets.bottom, 8);

  function navegar(aba: RodapeAba) {
    if (onSelecionarAba) {
      onSelecionarAba(aba);
    }

    if (aba === abaAtiva) return;

    if (aba === "home") {
      router.push("/(tabs)" as any);
    } else if (aba === "scanner") {
      router.push("/mapa" as any);
    } else if (aba === "pets") {
      router.push("/(tabs)" as any);
    } else if (aba === "ai") {
      router.push("/(tabs)" as any);
    } else if (aba === "chat") {
      router.push("/(tabs)" as any);
    }
  }

  return (
    <View
      style={[
        styles.rodape,
        {
          paddingBottom: paddingBottomCalculado,
          height: 56 + paddingBottomCalculado,
        },
      ]}
    >
      {/* 1. HOME */}
      <TouchableOpacity
        style={styles.itemRodape}
        onPress={() => navegar("home")}
        accessibilityLabel="Início"
        accessibilityRole="tab"
        accessibilityState={{ selected: abaAtiva === "home" }}
      >
        <Octicons
          name="home"
          size={20}
          color={abaAtiva === "home" ? COLORS.yellow : COLORS.cinzaclaro}
        />
        {abaAtiva === "home" && <View style={styles.tracoAtivo} />}
      </TouchableOpacity>

      {/* 2. ASSISTENTE IA */}
      <TouchableOpacity
        style={styles.itemRodape}
        onPress={() => navegar("ai")}
        accessibilityLabel="Assistente IA"
        accessibilityRole="tab"
        accessibilityState={{ selected: abaAtiva === "ai" }}
      >
        <MaterialCommunityIcons
          name="robot"
          size={22}
          color={abaAtiva === "ai" ? COLORS.yellow : COLORS.cinzaclaro}
        />
        {abaAtiva === "ai" && <View style={styles.tracoAtivo} />}
      </TouchableOpacity>

      {/* 3. MAPA / SCANNER (DESTAQUE) */}
      <TouchableOpacity
        style={styles.itemRodape}
        onPress={() => navegar("scanner")}
        accessibilityLabel="Mapa de Leituras"
        accessibilityRole="tab"
        accessibilityState={{ selected: abaAtiva === "scanner" }}
      >
        <Ionicons
          name={abaAtiva === "scanner" ? "map" : "map-outline"}
          size={22}
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
        accessibilityState={{ selected: abaAtiva === "chat" }}
      >
        <Ionicons
          name="chatbubble-outline"
          size={20}
          color={abaAtiva === "chat" ? COLORS.yellow : COLORS.cinzaclaro}
        />
        {abaAtiva === "chat" && <View style={styles.tracoAtivo} />}
      </TouchableOpacity>

      {/* 5. MEUS PETS */}
      <TouchableOpacity
        style={styles.itemRodape}
        onPress={() => navegar("pets")}
        accessibilityLabel="Pets"
        accessibilityRole="tab"
        accessibilityState={{ selected: abaAtiva === "pets" }}
      >
        <FontAwesome5
          name="paw"
          size={19}
          color={abaAtiva === "pets" ? COLORS.yellow : COLORS.cinzaclaro}
        />
        {abaAtiva === "pets" && <View style={styles.tracoAtivo} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  rodape: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderTopColor: "#EAEAEA",
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 99,
  },
  itemRodape: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    paddingVertical: 4,
  },
  tracoAtivo: {
    position: "absolute",
    bottom: 4,
    width: 18,
    height: 3,
    backgroundColor: COLORS.yellow,
    borderRadius: 2,
  },
});
