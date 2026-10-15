import React from "react";
import { StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";
import { COLORS } from "@/global/themes";

interface PetSafeLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function PetSafeLogo({
  size = "md",
  style,
  textStyle,
}: PetSafeLogoProps) {
  const fontSizes = {
    sm: 20,
    md: 24,
    lg: 28,
    xl: 34,
  };

  const fontSize = fontSizes[size];

  // Logo idêntica à tela de onboarding: pura tipografia sem ícone/fotinha ao lado
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.logoText, { fontSize }, textStyle]}>
        Pet<Text style={styles.safeColor}>Safe</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: COLORS.blue, // #1D1E64
    fontFamily: "Poppins_700Bold",
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  safeColor: {
    color: COLORS.yellow, // #FFB101
  },
});
