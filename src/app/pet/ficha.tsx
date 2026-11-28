import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorBanner, Field, FormHeader, PrimaryButton } from "@/components/ds";
import { DS } from "@/global/themes";
import { getFichaMedica, salvarFichaMedica } from "@/services/fichaMedica";
import { getPet, Pet } from "@/services/pets";

const C = DS.colors;

type Castrado = "sim" | "nao" | "";
const OPCOES_CASTRADO: { valor: Castrado; rotulo: string }[] = [
  { valor: "sim", rotulo: "Sim" },
  { valor: "nao", rotulo: "Não" },
  { valor: "", rotulo: "Não informado" },
];

// (63) 99999-9999
function mascararTelefone(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  if (d.length > 10) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
}

// "12,5" -> 12.5. Vazio é permitido.
function converterPeso(texto: string): { ok: boolean; valor: number | null } {
  const limpo = texto.trim().replace(",", ".");
  if (!limpo) return { ok: true, valor: null };
  const n = Number(limpo);
  if (!isFinite(n) || n <= 0 || n > 200) return { ok: false, valor: null };
  return { ok: true, valor: Math.round(n * 100) / 100 };
}

export default function FichaMedicaPet() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pet, setPet] = useState<Pet | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [peso, setPeso] = useState("");
  const [castrado, setCastrado] = useState<Castrado>("");
  const [tipoSanguineo, setTipoSanguineo] = useState("");
  const [microchip, setMicrochip] = useState("");
  const [alergias, setAlergias] = useState("");
  const [doencas, setDoencas] = useState("");
  const [medicamentos, setMedicamentos] = useState("");
  const [vetNome, setVetNome] = useState("");
  const [vetTelefone, setVetTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Carrega o pet e a ficha já salva (se existir)
  useEffect(() => {
    async function carregar() {
      if (!id) return;
      try {
        const [dadosPet, ficha] = await Promise.all([
          getPet(id).catch(() => null),
          getFichaMedica(id),
        ]);
        setPet(dadosPet);

        if (ficha) {
          setPeso(
            ficha.peso_kg != null
              ? String(ficha.peso_kg).replace(".", ",")
              : "",
          );
          setCastrado(
            ficha.castrado === true
              ? "sim"
              : ficha.castrado === false
                ? "nao"
                : "",
          );
          setTipoSanguineo(ficha.tipo_sanguineo ?? "");
          setMicrochip(ficha.microchip ?? "");
          setAlergias(ficha.alergias ?? "");
          setDoencas(ficha.doencas_cronicas ?? "");
          setMedicamentos(ficha.medicamentos_uso ?? "");
          setVetNome(ficha.veterinario_nome ?? "");
          setVetTelefone(ficha.veterinario_telefone ?? "");
          setObservacoes(ficha.observacoes_medicas ?? "");
        }
      } catch (e: any) {
        setErro(e?.message || "Não foi possível carregar a ficha médica.");
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [id]);

  function voltar() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }

  async function salvar() {
    setErro(null);
    if (!id) return;

    const pesoConvertido = converterPeso(peso);
    if (!pesoConvertido.ok) {
      setErro("Peso inválido. Use um valor entre 0 e 200 kg (ex.: 12,5).");
      return;
    }

    const telefoneLimpo = vetTelefone.replace(/\D/g, "");
    if (telefoneLimpo && telefoneLimpo.length < 10) {
      setErro("Telefone do veterinário incompleto.");
      return;
    }

    try {
      setSalvando(true);
      await salvarFichaMedica(id, {
        peso_kg: pesoConvertido.valor,
        castrado: castrado === "sim" ? true : castrado === "nao" ? false : null,
        tipo_sanguineo: tipoSanguineo.trim() || null,
        microchip: microchip.trim() || null,
        alergias: alergias.trim() || null,
        doencas_cronicas: doencas.trim() || null,
        medicamentos_uso: medicamentos.trim() || null,
        veterinario_nome: vetNome.trim() || null,
        veterinario_telefone: vetTelefone.trim() || null,
        observacoes_medicas: observacoes.trim() || null,
      });
      voltar();
    } catch (e: any) {
      setErro(e?.message || "Não foi possível salvar a ficha médica.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <SafeAreaView style={s.container}>
      {/* HEADER COM BOTÃO VOLTAR */}
      <View style={s.header}>
        <Pressable
          style={({ pressed }) => [s.botaoVoltar, pressed && s.pressed]}
          onPress={voltar}
          disabled={salvando}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.headerTitulo}>Ficha Médica</Text>
        <View style={{ width: 40 }} />
      </View>

      {carregando ? (
        <View style={s.centro}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={s.formulario}>
              <FormHeader
                eyebrow="Saúde"
                title={pet?.nome ? `Ficha de ${pet.nome}` : "Ficha médica"}
                subtitle="Informações básicas de saúde. Só você, o tutor, tem acesso."
              />

              {erro ? <ErrorBanner message={erro} /> : null}

              <Field
                label="Peso (kg)"
                icon="barbell-outline"
                value={peso}
                onChangeText={(v) => {
                  setPeso(v);
                  if (erro) setErro(null);
                }}
                placeholder="Ex.: 12,5"
                keyboardType="decimal-pad"
                returnKeyType="next"
                editable={!salvando}
              />

              <Text style={s.label}>Castrado</Text>
              <View style={s.chips}>
                {OPCOES_CASTRADO.map((opcao) => {
                  const ativo = castrado === opcao.valor;
                  return (
                    <Pressable
                      key={opcao.rotulo}
                      onPress={() => setCastrado(opcao.valor)}
                      disabled={salvando}
                      style={[s.chip, ativo && s.chipAtivo]}
                    >
                      <Text style={[s.chipTexto, ativo && s.chipTextoAtivo]}>
                        {opcao.rotulo}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Field
                label="Tipo sanguíneo"
                icon="water-outline"
                value={tipoSanguineo}
                onChangeText={setTipoSanguineo}
                placeholder="Ex.: DEA 1.1 positivo, tipo A"
                returnKeyType="next"
                editable={!salvando}
              />

              <Field
                label="Microchip"
                icon="hardware-chip-outline"
                value={microchip}
                onChangeText={setMicrochip}
                placeholder="Número do microchip"
                returnKeyType="next"
                editable={!salvando}
              />

              <Field
                label="Alergias"
                icon="alert-circle-outline"
                value={alergias}
                onChangeText={setAlergias}
                placeholder="Separe por vírgula"
                returnKeyType="next"
                editable={!salvando}
              />

              <Field
                label="Doenças crônicas"
                icon="pulse-outline"
                value={doencas}
                onChangeText={setDoencas}
                placeholder="Ex.: diabetes, cardiopatia"
                returnKeyType="next"
                editable={!salvando}
              />

              <Field
                label="Medicamentos em uso"
                icon="medkit-outline"
                value={medicamentos}
                onChangeText={setMedicamentos}
                placeholder="Nome e dose, se souber"
                returnKeyType="next"
                editable={!salvando}
              />

              <Field
                label="Veterinário"
                icon="person-outline"
                value={vetNome}
                onChangeText={setVetNome}
                placeholder="Nome do veterinário ou da clínica"
                autoCapitalize="words"
                returnKeyType="next"
                editable={!salvando}
              />

              <Field
                label="Telefone do veterinário"
                icon="call-outline"
                value={vetTelefone}
                onChangeText={(v) => {
                  setVetTelefone(mascararTelefone(v));
                  if (erro) setErro(null);
                }}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
                returnKeyType="next"
                editable={!salvando}
              />

              <Field
                label="Observações médicas"
                icon="document-text-outline"
                value={observacoes}
                onChangeText={setObservacoes}
                placeholder="Qualquer outra informação importante"
                returnKeyType="done"
                onSubmitEditing={salvar}
                editable={!salvando}
              />

              <View style={{ marginTop: 8 }}>
                <PrimaryButton
                  label="Salvar ficha"
                  onPress={salvar}
                  loading={salvando}
                  disabled={salvando}
                />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },

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
  headerTitulo: { fontSize: 18, fontFamily: DS.font.bold, color: C.text },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formulario: { width: "100%", maxWidth: 480 },

  label: {
    fontSize: 13,
    fontFamily: DS.font.semibold,
    color: C.text,
    marginBottom: 8,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipAtivo: { backgroundColor: C.primary, borderColor: C.primary },
  chipTexto: { fontSize: 13, fontFamily: DS.font.semibold, color: C.textMuted },
  chipTextoAtivo: { color: C.primaryText },
});
