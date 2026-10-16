import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";

import "react-native-reanimated";

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";

import { useAuthDeepLink } from "@/hooks/use-auth-deep-link";
import { DS } from "@/global/themes";

export default function RootLayout() {
  useAuthDeepLink();

  // Esconde os botões virtuais do próprio celular no Android (modo imersivo)
  useEffect(() => {
    if (Platform.OS === "android") {
      try {
        NavigationBar.setVisibilityAsync("hidden");
      } catch (e) {
        // Ignora em ambientes onde não suportado
      }
    }
  }, []);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const backgroundColor = DS.colors.bg;

  return (
    <>
      {Platform.OS === "android" && <NavigationBar.NavigationBar hidden={true} />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
        }}
      />
      <StatusBar style="dark" />
    </>
  );
}
