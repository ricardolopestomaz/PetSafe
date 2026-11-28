import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { DS } from "@/global/themes";
import { FichaMedica, getFichaMedica } from "@/services/fichaMedica";

const C = DS.colors;

type Props = { petId: string };

export default function FichaMedicaResumo({ petId }: Props) {
  const [ficha, setFicha] = useState<FichaMedica | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Recarrega ao voltar da tela de edição
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      getFichaMedica(petId)
        .then((dados) => ativo && setFicha(dados))
        .catch(() => ativo && setFicha(null))
        .finally(() => ativo && setCarregando(false));
      return () => {
        ativo = false;
      };
    }, [petId]),
  );

  function abrir() {
    router.push({ pathname: "/pet/ficha" as any, params: { id: petId } });
  }

  const tags: string[] = [];
  if (ficha?.peso_kg != null)
    tags.push(`${String(ficha.peso_kg).replace(".", ",")} kg`);
  if (ficha?.castrado === true) tags.push("Castrado");
  if (ficha?.castrado === false) tags.push("Não castrado");
  if (ficha?.tipo_sanguineo) tags.push(`Sangue: ${ficha.tipo_sanguineo}`);

  const linhas = [
    {
      icone: "alert-circle-outline",
      titulo: "Alergias",
      valor: ficha?.alergias,
    },
    {
      icone: "pulse-outline",
      titulo: "Doenças crônicas",
      valor: ficha?.doencas_cronicas,
    },
    {
      icone: "medkit-outline",
      titulo: "Medicamentos em uso",
      valor: ficha?.medicamentos_uso,
    },
    {
      icone: "hardware-chip-outline",
      titulo: "Microchip",
      valor: ficha?.microchip,
    },
    {
      icone: "person-outline",
      titulo: "Veterinário",
      valor: [ficha?.veterinario_nome, ficha?.veterinario_telefone]
        .filter(Boolean)
        .join(" • "),
    },
    {
      icone: "document-text-outline",
      titulo: "Observações",
      valor: ficha?.observacoes_medicas,
    },
  ].filter((l) => Boolean(l.valor));

  const preenchida = tags.length > 0 || linhas.length > 0;

  return (
    <View style={s.card}>
      <View style={s.cabecalho}>
        <View style={s.tituloLinha}>
          <View style={s.iconeCirculo}>
            <Ionicons name="medkit" size={16} color={C.primaryText} />
          </View>
          <View>
            <Text style={s.titulo}>Ficha Médica</Text>
            {ficha?.atualizado_em ? (
              <Text style={s.subtitulo}>
                Atualizada em{" "}
                {new Date(ficha.atualizado_em).toLocaleDateString("pt-BR")}
              </Text>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={abrir}
          hitSlop={6}
          style={({ pressed }) => [s.botao, pressed && s.pressed]}
          accessibilityRole="button"
          accessibilityLabel={
            preenchida ? "Editar ficha médica" : "Preencher ficha médica"
          }
        >
          <Ionicons
            name={preenchida ? "create" : "add"}
            size={14}
            color={C.primaryText}
          />
          <Text style={s.botaoTexto}>
            {preenchida ? "Editar" : "Preencher"}
          </Text>
        </Pressable>
      </View>

      {carregando ? null : preenchida ? (
        <>
          {tags.length > 0 ? (
            <View style={s.tags}>
              {tags.map((t) => (
                <View key={t} style={s.tag}>
                  <Text style={s.tagTexto}>{t}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {linhas.map((l) => (
            <View key={l.titulo} style={s.linha}>
              <Ionicons name={l.icone as any} size={16} color={C.textSubtle} />
              <View style={{ flex: 1 }}>
                <Text style={s.linhaTitulo}>{l.titulo}</Text>
                <Text style={s.linhaValor}>{l.valor}</Text>
              </View>
            </View>
          ))}
        </>
      ) : (
        <Text style={s.vazio}>
          Nenhuma informação médica cadastrada ainda. Preencha peso, alergias,
          medicamentos e o contato do veterinário.
        </Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  cabecalho: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  tituloLinha: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconeCirculo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  titulo: { fontSize: 16, fontFamily: DS.font.semibold, color: C.text },
  subtitulo: { fontSize: 11, fontFamily: DS.font.regular, color: C.textMuted },

  botao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: C.primary,
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  botaoTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.primaryText,
  },

  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  tagTexto: { fontSize: 11, fontFamily: DS.font.semibold, color: C.textMuted },

  linha: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  linhaTitulo: {
    fontSize: 11,
    fontFamily: DS.font.semibold,
    color: C.textMuted,
  },
  linhaValor: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.text,
    marginTop: 1,
  },

  vazio: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    lineHeight: 19,
  },
});
