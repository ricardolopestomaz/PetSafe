import type { Session } from "@supabase/supabase-js";
import * as NavigationBar from "expo-navigation-bar";
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

import "react-native-reanimated";

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from "@expo-google-fonts/poppins";

import { DS } from "@/global/themes";
import { useAuthDeepLink } from "@/hooks/use-auth-deep-link";
import { supabase } from "@/lib/supabaseClient";

export default function RootLayout() {
  useAuthDeepLink();

  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const [session, setSession] = useState<Session | null>(null);
  const [sessaoCarregada, setSessaoCarregada] = useState(false);

  // Lê a sessão salva e acompanha login/logout
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessaoCarregada(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, novaSessao) => {
        setSession(novaSessao);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Redireciona conforme o estado de login
  useEffect(() => {
    if (!sessaoCarregada || !navigationState?.key) return;

    const primeiroSegmento = segments[0] as string | undefined;
    const naAreaAuth = primeiroSegmento === "(auth)";
    const noCallback = primeiroSegmento === "auth-callback";

    if (noCallback) return; // deixa o retorno do login com Google terminar

    if (!session && !naAreaAuth) {
      router.replace("/(auth)/login");
    } else if (session && naAreaAuth) {
      router.replace("/(tabs)");
    }
  }, [session, sessaoCarregada, segments, navigationState?.key]);

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

  if (!fontsLoaded || !sessaoCarregada) {
    return null;
  }

  const backgroundColor = DS.colors.bg;

  return (
    <>
      {Platform.OS === "android" && (
        <NavigationBar.NavigationBar hidden={true} />
      )}
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
