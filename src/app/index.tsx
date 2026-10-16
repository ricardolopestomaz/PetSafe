import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { supabase } from "@/lib/supabaseClient";
import { COLORS, DS } from "@/global/themes";
import { isAppOrMobileDevice } from "@/lib/device";

export default function Index() {
  const [destino, setDestino] = useState<string | null>(null);

  useEffect(() => {
    async function checarSessao() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setDestino("/(tabs)");
        } else {
          // O Onboarding só deve aparecer se for no APP / CELULAR
          const isMobile = isAppOrMobileDevice();
          setDestino(isMobile ? "/(auth)/onboarding" : "/(auth)/login");
        }
      } catch {
        const isMobile = isAppOrMobileDevice();
        setDestino(isMobile ? "/(auth)/onboarding" : "/(auth)/login");
      }
    }

    checarSessao();
  }, []);

  if (!destino) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: DS.colors.bg,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.yellow} />
      </View>
    );
  }

  return <Redirect href={destino as any} />;
}