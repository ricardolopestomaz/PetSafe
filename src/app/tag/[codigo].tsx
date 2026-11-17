import React from "react";
import { Redirect, useLocalSearchParams } from "expo-router";

/**
 * Rota amigável para leitura direta da medalha via QR Code / NFC:
 * Exemplo: /tag/PS-2026-0101 -> redireciona para a Página Pública do Pet (/pet/PS-2026-0101)
 */
export default function TagRedirectScreen() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const destino = codigo ? `/pet/${encodeURIComponent(codigo)}` : "/pet/demo-pet-1";

  return <Redirect href={destino as any} />;
}
