import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import "react-native-reanimated";

import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";

import { useAuthDeepLink } from "@/hooks/use-auth-deep-link";
import { DS } from "@/global/themes";

export default function RootLayout() {


  useAuthDeepLink();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const backgroundColor = DS.colors.bg;

  return (
    <>
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
