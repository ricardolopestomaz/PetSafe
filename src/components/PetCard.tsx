import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { SquishyPressable } from "@/components/ds";
import { DS } from "@/global/themes";
import type { Pet } from "@/services/pets";

const C = DS.colors;

// Calcula a idade a partir de AAAA-MM-DD
function calcularIdade(iso?: string): string | null {
  if (!iso) return null;
  const nascimento = new Date(`${iso}T00:00:00`);
  if (isNaN(nascimento.getTime())) return null;

  const hoje = new Date();
  let meses =
    (hoje.getFullYear() - nascimento.getFullYear()) * 12 +
    (hoje.getMonth() - nascimento.getMonth());
  if (hoje.getDate() < nascimento.getDate()) meses--;

  if (meses < 0) return null;
  if (meses < 1) return "Menos de 1 mês";
  if (meses < 12) return `${meses} ${meses === 1 ? "mês" : "meses"}`;

  const anos = Math.floor(meses / 12);
  return `${anos} ${anos === 1 ? "ano" : "anos"}`;
}

function iconeDaEspecie(especie?: string): "dog" | "cat" | "paw" {
  if (especie === "Cachorro") return "dog";
  if (especie === "Gato") return "cat";
  return "paw";
}

type Props = {
  pet: Pet;
  onPress: () => void;
};

export default function PetCard({ pet, onPress }: Props) {
  const [erroImagem, setErroImagem] = useState(false);
  const mostrarFoto = Boolean(pet.foto_url) && !erroImagem;
  const idade = calcularIdade(pet.data_nascimento);

  return (
    <SquishyPressable
      style={s.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver perfil de ${pet.nome}`}
    >
      {/* Linha única: foto | informações | botão */}
      <View style={s.linha}>
        {/* FOTO (ou ícone da espécie, se não houver foto) */}
        <View
          style={[
            s.fotoWrapper,
            mostrarFoto ? s.fotoWrapperComFoto : s.fotoWrapperSemFoto,
          ]}
        >
          {mostrarFoto ? (
            <Image
              source={{ uri: pet.foto_url }}
              style={s.foto}
              resizeMode="cover"
              onError={() => setErroImagem(true)}
            />
          ) : (
            <MaterialCommunityIcons
              name={iconeDaEspecie(pet.especie)}
              size={24}
              color={C.primaryText}
            />
          )}
        </View>

        {/* INFORMAÇÕES AO LADO DA FOTO */}
        <View style={s.info}>
          <Text style={s.nome} numberOfLines={1}>
            {pet.nome}
          </Text>
          <Text style={s.raca} numberOfLines={1}>
            {pet.raca || "Sem raça definida"}
          </Text>

          <View style={s.tags}>
            {pet.especie ? (
              <View style={s.tag}>
                <Text style={s.tagTexto}>{pet.especie}</Text>
              </View>
            ) : null}
            {idade ? (
              <View style={s.tag}>
                <Ionicons name="gift-outline" size={10} color={C.textMuted} />
                <Text style={s.tagTexto}>{idade}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* "BOTÃO" VER PERFIL NA LATERAL (visual; o clique é do card inteiro) */}
        <View style={s.botao}>
          <Text style={s.botaoTexto}>Ver perfil</Text>
        </View>
      </View>
    </SquishyPressable>
  );
}

const s = StyleSheet.create({
  card: {
    marginBottom: 8,
    backgroundColor: C.surface,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
  },

  fotoWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fotoWrapperComFoto: {
    backgroundColor: C.surface, // fundo neutro: sem anel roxo
    borderWidth: 1,
    borderColor: C.border,
  },
  fotoWrapperSemFoto: {
    backgroundColor: C.primary, // roxo só para o ícone da espécie
  },
  foto: { width: "100%", height: "100%" },

  info: { flex: 1, minWidth: 0, gap: 1 },
  nome: { fontSize: 14, fontFamily: DS.font.bold, color: C.text },
  raca: { fontSize: 11, fontFamily: DS.font.regular, color: C.textMuted },

  tags: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 3 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagTexto: { fontSize: 10, fontFamily: DS.font.semibold, color: C.textMuted },

  botao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: C.primary,
  },
  botaoTexto: {
    fontSize: 11,
    fontFamily: DS.font.semibold,
    color: C.primaryText,
  },
});
