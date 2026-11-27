import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DS } from "@/global/themes";

const C = DS.colors;

type Props = {
  titulo: string;
  disabled?: boolean;
  // Para onde ir quando não há tela anterior na pilha (ex.: aberto por link)
  fallback?: string;
};

/** Cabeçalho das telas internas: botão voltar + título central (mesmo padrão de pet/novo). */
export default function HeaderVoltar({
  titulo,
  disabled,
  fallback = "/(tabs)",
}: Props) {
  function voltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as any);
    }
  }

  return (
    <View style={s.header}>
      <Pressable
        style={({ pressed }) => [s.botaoVoltar, pressed && s.pressed]}
        onPress={voltar}
        disabled={disabled}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Ionicons name="arrow-back" size={22} color={C.text} />
      </Pressable>
      <Text style={s.titulo}>{titulo}</Text>
      <View style={s.espaco} />
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
    backgroundColor: C.bg,
  },
  botaoVoltar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  titulo: { fontSize: 18, fontFamily: DS.font.bold, color: C.text },
  espaco: { width: 40 },
});
