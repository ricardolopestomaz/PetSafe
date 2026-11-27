import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import HeaderVoltar from "@/components/HeaderVoltar";
import PetForm from "@/components/PetForm";
import {
  cadastrarPet,
  ESPECIES,
  FormularioPet,
} from "@/controller/petController";
import { DS } from "@/global/themes";

const FORMULARIO_VAZIO: FormularioPet = {
  nome: "",
  especie: ESPECIES[0],
  raca: "",
  dataNascimento: "",
  observacoes: "",
  fotoUrlAtual: null,
  novaFoto: null,
  videoUrlAtual: null,
  novoVideo: null,
};

export default function NovoPet() {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(form: FormularioPet) {
    setErro(null);
    setSalvando(true);
    const resultado = await cadastrarPet(form);
    setSalvando(false);

    if (!resultado.sucesso) {
      setErro(resultado.mensagem || "Não foi possível cadastrar o pet.");
      return;
    }

    // Volta para quem abriu o cadastro (Home ou Perfil), que recarrega a lista ao focar
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <SafeAreaView style={s.container}>
      <HeaderVoltar titulo="Novo Pet" disabled={salvando} />
      <PetForm
        inicial={FORMULARIO_VAZIO}
        eyebrow="Novo pet"
        titulo="Cadastrar pet"
        subtitulo="Preencha os dados para proteger seu pet com a medalha PetSafe."
        rotuloBotao="Salvar pet"
        salvando={salvando}
        erro={erro}
        onErro={setErro}
        onSalvar={salvar}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.colors.bg },
});
