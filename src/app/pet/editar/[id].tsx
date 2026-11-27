import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorBanner } from "@/components/ds";
import HeaderVoltar from "@/components/HeaderVoltar";
import PetForm from "@/components/PetForm";
import {
  editarPet,
  FormularioPet,
  formularioDoPet,
} from "@/controller/petController";
import { DS } from "@/global/themes";
import { getPet, Pet } from "@/services/pets";

const C = DS.colors;

export default function EditarPet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!id) {
        setCarregando(false);
        return;
      }
      setCarregando(true);
      const dados = await getPet(id).catch(() => null);
      if (!ativo) return;
      setPet(dados);
      setCarregando(false);
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [id, tentativa]);

  async function salvar(form: FormularioPet) {
    if (!pet) return;
    setErro(null);
    setSalvando(true);
    const resultado = await editarPet(pet, form);
    setSalvando(false);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem || "Não foi possível salvar as alterações.");
      return;
    }

    // Volta para os detalhes do pet, que recarregam ao ganhar foco
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/pet/${pet.id}` as any);
    }
  }

  const fallback = id ? `/pet/${id}` : "/(tabs)";

  if (carregando) {
    return (
      <SafeAreaView style={s.container}>
        <HeaderVoltar titulo="Editar Pet" fallback={fallback} />
        <View style={s.centro}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={s.container}>
        <HeaderVoltar titulo="Editar Pet" fallback="/(tabs)" />
        <View style={s.centro}>
          <ErrorBanner message="Não foi possível carregar este pet para edição." />
          <Pressable onPress={() => setTentativa((t) => t + 1)} hitSlop={8}>
            <Text style={s.link}>Tentar novamente</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <HeaderVoltar titulo="Editar Pet" disabled={salvando} fallback={fallback} />
      <PetForm
        // key garante que o formulário reinicie se outro pet for carregado
        key={pet.id}
        inicial={formularioDoPet(pet)}
        eyebrow="Editar pet"
        titulo={pet.nome}
        subtitulo="Atualize os dados do seu pet. As alterações aparecem em todo o app."
        rotuloBotao="Salvar alterações"
        salvando={salvando}
        erro={erro}
        onErro={setErro}
        onSalvar={salvar}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  link: { fontSize: 14, fontFamily: DS.font.semibold, color: C.primary },
});
