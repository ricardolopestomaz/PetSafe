import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS, DS } from "@/global/themes";
import {
  ContatoEmergenciaDTO,
  listarPetsPublicos,
  Pet,
} from "@/services/pets";
import {
  capturarLocalizacaoERegistrarLeitura,
  Leitura,
  listarLeiturasPorPet,
} from "@/services/leituras";
import PetMap from "@/components/PetMap";
import { PetSafeLogo } from "@/components/PetSafeLogo";
import { PetIconBySpecies } from "@/components/PetIcons";
import RodapeNav from "@/components/RodapeNav";

const C = DS.colors;

type AbaDetalhe = "resumo" | "localizacao" | "saude";
type FiltroEspecie = "todos" | "cachorro" | "gato";

function limparTelefone(tel: string): string {
  return (tel || "").replace(/\D/g, "");
}

function normalizarTexto(texto: string): string {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function PaginaPublicaPet() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Lista de pets e pet selecionado (Passo 1: Lista -> Passo 2: Detalhes do Pet)
  const [pets, setPets] = useState<Pet[]>([]);
  const [petSelecionado, setPetSelecionado] = useState<Pet | null>(null);
  const [filtroEspecie, setFiltroEspecie] = useState<FiltroEspecie>("todos");
  const [buscaNome, setBuscaNome] = useState("");
  const [abaDetalhe, setAbaDetalhe] = useState<AbaDetalhe>("resumo");

  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoLeituras, setCarregandoLeituras] = useState(false);

  // Estado de compartilhamento de localização
  const [observacaoEncontrou, setObservacaoEncontrou] = useState("");
  const [enviandoLocalizacao, setEnviandoLocalizacao] = useState(false);
  const [feedbackLocalizacao, setFeedbackLocalizacao] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);
  const [linkCopiado, setLinkCopiado] = useState(false);

  const carregarListaPets = useCallback(async () => {
    try {
      setCarregando(true);
      const lista = await listarPetsPublicos();
      setPets(lista || []);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    Promise.resolve().then(() => {
      if (ativo) {
        carregarListaPets();
      }
    });
    return () => {
      ativo = false;
    };
  }, [carregarListaPets]);

  async function selecionarPet(pet: Pet) {
    setPetSelecionado(pet);
    setAbaDetalhe("resumo");
    setFeedbackLocalizacao(null);
    setObservacaoEncontrou("");

    try {
      setCarregandoLeituras(true);
      const dadosLeituras = await listarLeiturasPorPet(pet.id).catch(() => []);
      setLeituras(dadosLeituras);
    } finally {
      setCarregandoLeituras(false);
    }
  }

  function voltarParaLista() {
    setPetSelecionado(null);
    setFeedbackLocalizacao(null);
  }

  function voltarTelaAnterior() {
    if (petSelecionado) {
      voltarParaLista();
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)" as any);
    }
  }

  // Ações de contato
  async function abrirWhatsApp(numero?: string, nomeContato?: string) {
    if (!petSelecionado) return;
    const fone = limparTelefone(
      numero ||
        petSelecionado.tutor?.whatsapp ||
        petSelecionado.tutor?.telefone ||
        "5563992458810"
    );
    const foneComDdi = fone.startsWith("55") ? fone : `55${fone}`;
    const msg = encodeURIComponent(
      `Olá${
        nomeContato ? ` ${nomeContato.split(" ")[0]}` : ""
      }! Vi o alerta do(a) pet *${petSelecionado.nome}* (${
        petSelecionado.tag?.codigo || "Medalha PetSafe"
      }) no PetSafe e quero ajudar!`
    );
    try {
      await Linking.openURL(`https://wa.me/${foneComDdi}?text=${msg}`);
    } catch {
      Alert.alert(
        "WhatsApp do Tutor",
        numero || petSelecionado.tutor?.telefone || "(63) 99245-8810"
      );
    }
  }

  async function ligarParaNumero(numero?: string) {
    const fone = limparTelefone(
      numero || petSelecionado?.tutor?.telefone || "63992458810"
    );
    try {
      await Linking.openURL(`tel:${fone}`);
    } catch {
      Alert.alert(
        "Telefone",
        numero || petSelecionado?.tutor?.telefone || "(63) 99245-8810"
      );
    }
  }

  async function abrirRotaNoMapa(lat: number, lng: number) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Localização",
        `Latitude: ${lat.toFixed(5)}, Longitude: ${lng.toFixed(5)}`
      );
    }
  }

  async function compartilharPet() {
    if (!petSelecionado) return;
    const urlPublica =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.href
        : `https://petsafe.app/pet/${petSelecionado.id}`;

    try {
      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(urlPublica);
        setLinkCopiado(true);
        setTimeout(() => setLinkCopiado(false), 2500);
        return;
      }
      await Share.share({
        title: `PetSafe — ${petSelecionado.nome}`,
        message: `Ajude a encontrar ${petSelecionado.nome}: ${urlPublica}`,
        url: urlPublica,
      });
    } catch {
      Alert.alert("Link do Pet", urlPublica);
    }
  }

  async function handleEnviarLocalizacao() {
    if (!petSelecionado) return;
    setEnviandoLocalizacao(true);
    setFeedbackLocalizacao(null);

    const resultado = await capturarLocalizacaoERegistrarLeitura({
      petId: petSelecionado.id,
      tipoLeitura: "qrcode",
      observacao: observacaoEncontrou,
    });

    setEnviandoLocalizacao(false);

    if (!resultado.sucesso) {
      setFeedbackLocalizacao({
        tipo: "erro",
        texto: resultado.mensagem,
      });
      return;
    }

    if (resultado.leitura) {
      setLeituras((prev) => [resultado.leitura!, ...prev]);
    }

    setFeedbackLocalizacao({
      tipo: "sucesso",
      texto: resultado.mensagem,
    });
    setObservacaoEncontrou("");
  }

  // Filtra pets pela espécie selecionada e pelo nome pesquisado
  const termoBusca = normalizarTexto(buscaNome);
  const petsFiltrados = pets.filter((item) => {
    if (filtroEspecie !== "todos") {
      const esp = normalizarTexto(item.especie || "");
      if (
        filtroEspecie === "cachorro" &&
        !esp.includes("cachorro") &&
        !esp.includes("cao")
      ) {
        return false;
      }
      if (
        filtroEspecie === "gato" &&
        !esp.includes("gato") &&
        !esp.includes("felin")
      ) {
        return false;
      }
    }

    if (termoBusca.length > 0) {
      const nomeNorm = normalizarTexto(item.nome);
      const racaNorm = normalizarTexto(item.raca || "");
      const tagNorm = normalizarTexto(item.tag?.codigo || "");
      return (
        nomeNorm.includes(termoBusca) ||
        racaNorm.includes(termoBusca) ||
        tagNorm.includes(termoBusca)
      );
    }

    return true;
  });

  if (carregando) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.yellow} />
        <Text style={styles.loadingText}>Carregando pets perdidos...</Text>
      </SafeAreaView>
    );
  }

  /* ========================================================================
   * PASSO 1: LISTA DE PETS PERDIDOS (TELA INICIAL DA ABA)
   * ======================================================================== */
  if (!petSelecionado) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {/* CABEÇALHO DA LISTA */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.botaoIconeHeader}
            onPress={voltarTelaAnterior}
            activeOpacity={0.75}
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>

          <View style={styles.headerCentro}>
            <Text style={styles.headerTitulo}>Pets Perdidos</Text>
            <Text style={styles.headerSubtitulo}>
              Toque em um pet para ver seus dados
            </Text>
          </View>

          <PetSafeLogo size="sm" />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContainer}>
            {/* AVISO INFORMATIVO SIMPLES */}
            <View style={styles.avisoMural}>
              <View style={styles.avisoMuralIcone}>
                <Ionicons name="megaphone" size={20} color="#DC2626" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.avisoMuralTitulo}>
                  Encontrou um destes pets?
                </Text>
                <Text style={styles.avisoMuralTexto}>
                  Selecione o pet abaixo para abrir o contato direto do tutor e
                  enviar a localização.
                </Text>
              </View>
            </View>

            {/* BARRA DE PESQUISA PELO NOME DO PET */}
            <View style={styles.barraPesquisaContainer}>
              <Ionicons name="search-outline" size={18} color={C.textMuted} />
              <TextInput
                style={[
                  styles.inputPesquisa,
                  Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                ]}
                value={buscaNome}
                onChangeText={setBuscaNome}
                placeholder="Pesquisar pelo nome do pet..."
                placeholderTextColor={C.textSubtle}
                autoCorrect={false}
                returnKeyType="search"
              />
              {buscaNome.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setBuscaNome("")}
                  hitSlop={8}
                  activeOpacity={0.7}
                  accessibilityLabel="Limpar pesquisa"
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={C.textSubtle}
                  />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* FILTROS POR ESPÉCIE */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtrosRow}
            >
              <TouchableOpacity
                style={[
                  styles.chipFiltro,
                  filtroEspecie === "todos" && styles.chipFiltroAtivo,
                ]}
                onPress={() => setFiltroEspecie("todos")}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="paw"
                  size={14}
                  color={filtroEspecie === "todos" ? COLORS.white : COLORS.blue}
                />
                <Text
                  style={[
                    styles.chipFiltroTexto,
                    filtroEspecie === "todos" && styles.chipFiltroTextoAtivo,
                  ]}
                >
                  Todos ({pets.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipFiltro,
                  filtroEspecie === "cachorro" && styles.chipFiltroAtivo,
                ]}
                onPress={() => setFiltroEspecie("cachorro")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipFiltroTexto,
                    filtroEspecie === "cachorro" && styles.chipFiltroTextoAtivo,
                  ]}
                >
                  Cachorros
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.chipFiltro,
                  filtroEspecie === "gato" && styles.chipFiltroAtivo,
                ]}
                onPress={() => setFiltroEspecie("gato")}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.chipFiltroTexto,
                    filtroEspecie === "gato" && styles.chipFiltroTextoAtivo,
                  ]}
                >
                  Gatos
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* LISTA DE CARDS DE PETS PERDIDOS */}
            {petsFiltrados.length === 0 ? (
              <View style={styles.vazioContainer}>
                <Ionicons
                  name="search-outline"
                  size={36}
                  color={C.textSubtle}
                />
                <Text style={styles.vazioTitulo}>
                  Nenhum pet encontrado
                </Text>
                <Text style={styles.vazioSubtitulo}>
                  Não encontramos nenhum pet com &quot;{buscaNome}&quot;.
                </Text>
                <TouchableOpacity
                  style={styles.botaoLimparBusca}
                  onPress={() => {
                    setBuscaNome("");
                    setFiltroEspecie("todos");
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.botaoLimparBuscaTexto}>
                    Limpar filtros
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.listaCardsContainer,
                  isDesktop && styles.listaCardsDesktop,
                ]}
              >
                {petsFiltrados.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.cardListaPet,
                      isDesktop && styles.cardListaPetDesktop,
                    ]}
                    activeOpacity={0.88}
                    onPress={() => selecionarPet(item)}
                  >
                    {/* Topo do Card: Badge Perdido + Código da Tag */}
                    <View style={styles.cardListaTopo}>
                      <View style={styles.badgePerdido}>
                        <View style={styles.pontoPerdido} />
                        <Text style={styles.badgePerdidoTexto}>PERDIDO</Text>
                      </View>
                      <Text style={styles.tagCodigoLista}>
                        Tag {item.tag?.codigo || "PS-2026"}
                      </Text>
                    </View>

                    {/* Identificação Principal */}
                    <View style={styles.cardListaCorpo}>
                      <View style={styles.avatarListaCirculo}>
                        <PetIconBySpecies
                          especie={item.especie}
                          size={38}
                          fallbackColor={COLORS.blue}
                        />
                      </View>

                      <View style={styles.flex1}>
                        <Text style={styles.cardListaNome}>{item.nome}</Text>
                        <Text style={styles.cardListaSub}>
                          {item.especie || "Pet"} • {item.raca || "SRD"}
                        </Text>
                        <View style={styles.cardListaLocalRow}>
                          <Ionicons
                            name="location-sharp"
                            size={14}
                            color="#DC2626"
                          />
                          <Text
                            style={styles.cardListaLocalTexto}
                            numberOfLines={1}
                          >
                            {item.bairro
                              ? `${item.bairro}, ${item.cidade || "Palmas - TO"}`
                              : item.cidade || "Palmas - TO"}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Resumo curto */}
                    <Text style={styles.cardListaResumo} numberOfLines={2}>
                      {item.observacoes ||
                        item.tag?.mensagem_alerta ||
                        "Clique para ver os contatos do tutor e ajudar."}
                    </Text>

                    {/* Botão de Ação */}
                    <View style={styles.botaoVerPetCard}>
                      <Text style={styles.botaoVerPetCardTexto}>
                        Ver informações do pet
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color={COLORS.white}
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <RodapeNav abaAtiva="pets" />
      </SafeAreaView>
    );
  }

  /* ========================================================================
   * PASSO 2: DETALHES DO PET SELECIONADO (ORGANIZADO EM ABAS LIMPAS)
   * ======================================================================== */
  const ultimaLeitura = leituras.length > 0 ? leituras[0] : null;
  const contatosOrdenados: ContatoEmergenciaDTO[] = (
    petSelecionado.contatos_emergencia || []
  )
    .slice()
    .sort((a, b) => a.prioridade - b.prioridade);
  const ficha = petSelecionado.ficha_medica;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* CABEÇALHO DE DETALHES COM BOTÃO DE VOLTAR PARA A LISTA */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.botaoVoltarLista}
          onPress={voltarParaLista}
          activeOpacity={0.75}
        >
          <Ionicons name="arrow-back" size={18} color={COLORS.blue} />
          <Text style={styles.botaoVoltarListaTexto}>Pets Perdidos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoCompartilhar}
          onPress={compartilharPet}
          activeOpacity={0.75}
        >
          <Ionicons
            name={linkCopiado ? "checkmark-circle" : "share-social-outline"}
            size={16}
            color={linkCopiado ? "#15803D" : C.text}
          />
          <Text
            style={[
              styles.botaoCompartilharTexto,
              linkCopiado && { color: "#15803D" },
            ]}
          >
            {linkCopiado ? "Copiado!" : "Compartilhar"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detalheWrapper}>
          {/* CARD DE DESTAQUE DO PET (SEM 3D TILT QUE QUEBRA NO MOBILE) */}
          <LinearGradient
            colors={["#1D4ED8", "#1E3A8A"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.tagBadgeHero}>
                <Ionicons name="qr-code-outline" size={13} color={COLORS.yellow} />
                <Text style={styles.tagBadgeHeroTexto}>
                  TAG {petSelecionado.tag?.codigo || "PS-2026-0101"}
                </Text>
              </View>

              <View style={styles.statusPerdidoHero}>
                <View style={styles.pontoPerdidoBranco} />
                <Text style={styles.statusPerdidoHeroTexto}>PET PERDIDO</Text>
              </View>
            </View>

            <View style={styles.heroPerfilRow}>
              <View style={styles.avatarDetalheCirculo}>
                <PetIconBySpecies
                  especie={petSelecionado.especie}
                  size={44}
                  fallbackColor={COLORS.white}
                />
              </View>

              <View style={styles.flex1}>
                <Text style={styles.petNomeHero}>{petSelecionado.nome}</Text>
                <Text style={styles.petRacaHero}>
                  {petSelecionado.especie || "Pet"} •{" "}
                  {petSelecionado.raca || "Sem raça definida"}
                </Text>
                <View style={styles.localHeroRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={COLORS.yellow}
                  />
                  <Text style={styles.localHeroTexto}>
                    {petSelecionado.bairro
                      ? `${petSelecionado.bairro}, ${
                          petSelecionado.cidade || "Palmas - TO"
                        }`
                      : petSelecionado.cidade || "Palmas - TO"}
                  </Text>
                </View>
              </View>
            </View>

            {/* GRADE 2x2 FIXA PARA MOBILE E WEB (NUNCA CORTA O TEXTO) */}
            <View style={styles.gradeAtributos}>
              <View style={styles.itemAtributo}>
                <Text style={styles.labelAtributo}>IDADE</Text>
                <Text style={styles.valorAtributo}>
                  {petSelecionado.idade || "2 anos"}
                </Text>
              </View>

              <View style={styles.itemAtributo}>
                <Text style={styles.labelAtributo}>PORTE</Text>
                <Text style={styles.valorAtributo}>
                  {petSelecionado.porte || "Médio"}
                </Text>
              </View>

              <View style={styles.itemAtributo}>
                <Text style={styles.labelAtributo}>SEXO</Text>
                <Text style={styles.valorAtributo}>
                  {petSelecionado.sexo || "Macho"}
                </Text>
              </View>

              <View style={styles.itemAtributo}>
                <Text style={styles.labelAtributo}>COR</Text>
                <Text style={styles.valorAtributo}>
                  {petSelecionado.cor || "Caramelo"}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* BOTÕES DE AÇÃO DIRETA (100% VISÍVEIS NO CELULAR E NA WEB) */}
          <View style={styles.acoesPrincipaisBox}>
            <TouchableOpacity
              style={styles.botaoWhatsAppGrande}
              activeOpacity={0.85}
              onPress={() =>
                abrirWhatsApp(
                  petSelecionado.tutor?.whatsapp,
                  petSelecionado.tutor?.nome
                )
              }
            >
              <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
              <Text style={styles.botaoWhatsAppGrandeTexto}>
                Chamar Tutor no WhatsApp
              </Text>
            </TouchableOpacity>

            <View style={styles.botoesDuplosRow}>
              <TouchableOpacity
                style={styles.botaoSecundarioAcao}
                activeOpacity={0.85}
                onPress={() => ligarParaNumero(petSelecionado.tutor?.telefone)}
              >
                <Ionicons name="call" size={18} color={COLORS.blue} />
                <Text style={styles.botaoSecundarioAcaoTexto}>
                  Ligar para Tutor
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botaoSecundarioLocalizacao}
                activeOpacity={0.85}
                onPress={() => setAbaDetalhe("localizacao")}
              >
                <Ionicons name="locate" size={18} color={C.primary} />
                <Text style={styles.botaoSecundarioLocalizacaoTexto}>
                  Enviar Localização
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ABAS INTERNAS PARA EVITAR POLUIÇÃO VISUAL */}
          <View style={styles.abasContainer}>
            <TouchableOpacity
              style={[
                styles.abaItem,
                abaDetalhe === "resumo" && styles.abaItemAtiva,
              ]}
              onPress={() => setAbaDetalhe("resumo")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={abaDetalhe === "resumo" ? COLORS.blue : C.textMuted}
              />
              <Text
                style={[
                  styles.abaTexto,
                  abaDetalhe === "resumo" && styles.abaTextoAtivo,
                ]}
              >
                Resumo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.abaItem,
                abaDetalhe === "localizacao" && styles.abaItemAtiva,
              ]}
              onPress={() => setAbaDetalhe("localizacao")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="location-outline"
                size={16}
                color={abaDetalhe === "localizacao" ? COLORS.blue : C.textMuted}
              />
              <Text
                style={[
                  styles.abaTexto,
                  abaDetalhe === "localizacao" && styles.abaTextoAtivo,
                ]}
              >
                Localização
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.abaItem,
                abaDetalhe === "saude" && styles.abaItemAtiva,
              ]}
              onPress={() => setAbaDetalhe("saude")}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="medical-bag"
                size={16}
                color={abaDetalhe === "saude" ? COLORS.blue : C.textMuted}
              />
              <Text
                style={[
                  styles.abaTexto,
                  abaDetalhe === "saude" && styles.abaTextoAtivo,
                ]}
              >
                Saúde
              </Text>
            </TouchableOpacity>
          </View>

          {/* CONTEÚDO DA ABA 1: RESUMO & CONTATOS */}
          {abaDetalhe === "resumo" && (
            <View style={styles.blocoConteudo}>
              {/* Alerta / Como abordar */}
              <View style={styles.cardInfoSimples}>
                <Text style={styles.tituloCardInterno}>
                  Sobre o desaparecimento
                </Text>
                <Text style={styles.textoCardInterno}>
                  {petSelecionado.tag?.mensagem_alerta ||
                    petSelecionado.observacoes}
                </Text>

                {petSelecionado.comportamento ? (
                  <View style={styles.boxComportamento}>
                    <Ionicons
                      name="heart-outline"
                      size={18}
                      color={COLORS.blue}
                    />
                    <Text style={styles.textoComportamento}>
                      <Text style={styles.negrito}>Temperamento: </Text>
                      {petSelecionado.comportamento}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Contatos de Emergência */}
              <View style={styles.cardInfoSimples}>
                <Text style={styles.tituloCardInterno}>
                  Contatos do Tutor e Emergência
                </Text>

                <View style={styles.listaContatos}>
                  {contatosOrdenados.map((contato) => (
                    <View key={contato.id} style={styles.itemContato}>
                      <View style={styles.itemContatoInfo}>
                        <Text style={styles.itemContatoRelacao}>
                          {contato.prioridade}º • {contato.relacao}
                        </Text>
                        <Text style={styles.itemContatoNome}>
                          {contato.nome}
                        </Text>
                        <Text style={styles.itemContatoFone}>
                          {contato.telefone}
                        </Text>
                      </View>

                      <View style={styles.itemContatoBotoes}>
                        <TouchableOpacity
                          style={styles.miniBotaoWhats}
                          onPress={() =>
                            abrirWhatsApp(
                              contato.whatsapp || contato.telefone,
                              contato.nome
                            )
                          }
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="logo-whatsapp"
                            size={16}
                            color="#15803D"
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.miniBotaoLigar}
                          onPress={() => ligarParaNumero(contato.telefone)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="call-outline"
                            size={16}
                            color={COLORS.blue}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* CONTEÚDO DA ABA 2: LOCALIZAÇÃO & MAPA */}
          {abaDetalhe === "localizacao" && (
            <View style={styles.blocoConteudo}>
              {/* Enviar localização atual */}
              <View style={styles.cardInfoSimples}>
                <Text style={styles.tituloCardInterno}>
                  Você está vendo {petSelecionado.nome} agora?
                </Text>
                <Text style={styles.textoCardInterno}>
                  Envie sua localização atual para avisar o tutor exatamente onde
                  o pet está.
                </Text>

                <TextInput
                  style={styles.inputObservacao}
                  value={observacaoEncontrou}
                  onChangeText={setObservacaoEncontrou}
                  placeholder="Ponto de referência opcional (ex: Em frente à padaria)"
                  placeholderTextColor={C.textSubtle}
                />

                <TouchableOpacity
                  style={[
                    styles.botaoEnviarGps,
                    enviandoLocalizacao && { opacity: 0.65 },
                  ]}
                  onPress={handleEnviarLocalizacao}
                  disabled={enviandoLocalizacao}
                  activeOpacity={0.85}
                >
                  {enviandoLocalizacao ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <>
                      <Ionicons
                        name="navigate"
                        size={18}
                        color={COLORS.white}
                      />
                      <Text style={styles.botaoEnviarGpsTexto}>
                        Enviar Minha Localização Atual
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {feedbackLocalizacao ? (
                  <View
                    style={[
                      styles.feedbackBox,
                      feedbackLocalizacao.tipo === "sucesso"
                        ? styles.feedbackSucesso
                        : styles.feedbackErro,
                    ]}
                  >
                    <Ionicons
                      name={
                        feedbackLocalizacao.tipo === "sucesso"
                          ? "checkmark-circle"
                          : "alert-circle"
                      }
                      size={18}
                      color={
                        feedbackLocalizacao.tipo === "sucesso"
                          ? "#15803D"
                          : "#DC2626"
                      }
                    />
                    <Text
                      style={[
                        styles.feedbackTexto,
                        {
                          color:
                            feedbackLocalizacao.tipo === "sucesso"
                              ? "#14532D"
                              : "#7F1D1D",
                        },
                      ]}
                    >
                      {feedbackLocalizacao.texto}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Mapa da última leitura */}
              <View style={styles.cardInfoSimples}>
                <View style={styles.mapaHeaderRow}>
                  <Text style={styles.tituloCardInterno}>
                    Último local visto
                  </Text>
                  <TouchableOpacity
                    style={styles.linkMapaCompleto}
                    onPress={() =>
                      router.push({
                        pathname: "/mapa" as any,
                        params: { petId: petSelecionado.id },
                      })
                    }
                  >
                    <Text style={styles.linkMapaCompletoTexto}>
                      Abrir Mapa Completo
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color={C.primary}
                    />
                  </TouchableOpacity>
                </View>

                {carregandoLeituras ? (
                  <ActivityIndicator
                    size="small"
                    color={COLORS.blue}
                    style={{ marginVertical: 20 }}
                  />
                ) : leituras.length > 0 ? (
                  <>
                    <View style={styles.mapaWrapper}>
                      <PetMap
                        leituras={leituras}
                        mostrarControles={false}
                        mostrarCarousel={false}
                        style={styles.mapaPreview}
                      />
                    </View>

                    {ultimaLeitura && (
                      <View style={styles.resumoUltimaLeitura}>
                        <Text style={styles.enderecoLeitura}>
                          📍{" "}
                          {ultimaLeitura.endereco_aproximado ||
                            `${ultimaLeitura.bairro || ""}, ${
                              ultimaLeitura.cidade || "Palmas"
                            }`}
                        </Text>
                        <Text style={styles.dataLeitura}>
                          Registrado em:{" "}
                          {new Date(ultimaLeitura.criado_em).toLocaleString(
                            "pt-BR"
                          )}
                        </Text>

                        <TouchableOpacity
                          style={styles.botaoAbrirRota}
                          onPress={() =>
                            abrirRotaNoMapa(
                              ultimaLeitura.latitude,
                              ultimaLeitura.longitude
                            )
                          }
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="map-outline"
                            size={16}
                            color={COLORS.blue}
                          />
                          <Text style={styles.botaoAbrirRotaTexto}>
                            Traçar Rota no Google Maps
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.textoCardInterno}>
                    Nenhuma leitura registrada recentemente.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* CONTEÚDO DA ABA 3: SAÚDE & CUIDADOS */}
          {abaDetalhe === "saude" && (
            <View style={styles.blocoConteudo}>
              <View style={styles.cardInfoSimples}>
                <Text style={styles.tituloCardInterno}>
                  Ficha Médica Básica
                </Text>

                <View style={styles.chipsSaudeRow}>
                  <View style={styles.chipSaudeOk}>
                    <Ionicons
                      name="checkmark-circle"
                      size={15}
                      color="#15803D"
                    />
                    <Text style={styles.chipSaudeOkTexto}>
                      {ficha?.vacinas_em_dia
                        ? "Vacinas em dia"
                        : "Vacinação pendente"}
                    </Text>
                  </View>

                  <View style={styles.chipSaudeInfo}>
                    <Text style={styles.chipSaudeInfoTexto}>
                      {ficha?.castrado ? "Castrado(a)" : "Não castrado(a)"}
                    </Text>
                  </View>

                  {ficha?.peso_kg ? (
                    <View style={styles.chipSaudeInfo}>
                      <Text style={styles.chipSaudeInfoTexto}>
                        Peso: {ficha.peso_kg} kg
                      </Text>
                    </View>
                  ) : null}
                </View>

                {ficha?.alergias && ficha.alergias.length > 0 ? (
                  <View style={styles.boxAlertaSaude}>
                    <Text style={styles.tituloAlertaSaude}>
                      ⚠️ Alergias e Restrições
                    </Text>
                    <Text style={styles.textoAlertaSaude}>
                      {ficha.alergias.join(" • ")}
                    </Text>
                  </View>
                ) : null}

                {ficha?.cuidados_especiais ? (
                  <View style={styles.itemFichaSimples}>
                    <Text style={styles.labelFichaSimples}>
                      Cuidados Imediatos
                    </Text>
                    <Text style={styles.valorFichaSimples}>
                      {ficha.cuidados_especiais}
                    </Text>
                  </View>
                ) : null}

                {ficha?.restricoes_alimentares ? (
                  <View style={styles.itemFichaSimples}>
                    <Text style={styles.labelFichaSimples}>Alimentação</Text>
                    <Text style={styles.valorFichaSimples}>
                      {ficha.restricoes_alimentares}
                    </Text>
                  </View>
                ) : null}

                {ficha?.veterinario_nome ? (
                  <View style={styles.boxVeterinario}>
                    <View style={styles.flex1}>
                      <Text style={styles.labelFichaSimples}>
                        Veterinário(a) de Referência
                      </Text>
                      <Text style={styles.nomeVeterinario}>
                        {ficha.veterinario_nome}
                      </Text>
                      {ficha.veterinario_telefone ? (
                        <Text style={styles.foneVeterinario}>
                          {ficha.veterinario_telefone}
                        </Text>
                      ) : null}
                    </View>
                    {ficha.veterinario_telefone ? (
                      <TouchableOpacity
                        style={styles.botaoLigarVet}
                        onPress={() =>
                          ligarParaNumero(ficha.veterinario_telefone)
                        }
                        activeOpacity={0.85}
                      >
                        <Ionicons name="call" size={14} color={COLORS.white} />
                        <Text style={styles.botaoLigarVetTexto}>Ligar</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <RodapeNav abaAtiva="pets" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.bg,
    gap: 12,
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.textMuted,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
    gap: 10,
  },
  botaoIconeHeader: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCentro: {
    flex: 1,
  },
  headerTitulo: {
    fontSize: 17,
    fontFamily: DS.font.bold,
    color: C.text,
  },
  headerSubtitulo: {
    fontSize: 11,
    fontFamily: DS.font.regular,
    color: C.textMuted,
  },
  botaoVoltarLista: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  botaoVoltarListaTexto: {
    fontSize: 12,
    fontFamily: DS.font.bold,
    color: COLORS.blue,
  },
  botaoCompartilhar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
  },
  botaoCompartilharTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  mainContainer: {
    maxWidth: 880,
    width: "100%",
    alignSelf: "center",
    gap: 14,
  },
  avisoMural: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: DS.radius.md,
    padding: 14,
  },
  avisoMuralIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  avisoMuralTitulo: {
    fontSize: 14,
    fontFamily: DS.font.bold,
    color: "#991B1B",
  },
  avisoMuralTexto: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: DS.font.regular,
    color: "#7F1D1D",
    marginTop: 2,
  },
  barraPesquisaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    backgroundColor: C.surface,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: C.border,
  },
  inputPesquisa: {
    flex: 1,
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.text,
    paddingVertical: 0,
  },
  vazioContainer: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  vazioTitulo: {
    fontSize: 15,
    fontFamily: DS.font.bold,
    color: C.text,
  },
  vazioSubtitulo: {
    fontSize: 12,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    textAlign: "center",
  },
  botaoLimparBusca: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  botaoLimparBuscaTexto: {
    fontSize: 12,
    fontFamily: DS.font.bold,
    color: COLORS.blue,
  },
  filtrosRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 2,
  },
  chipFiltro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipFiltroAtivo: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  chipFiltroTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: COLORS.blue,
  },
  chipFiltroTextoAtivo: {
    color: COLORS.white,
  },
  listaCardsContainer: {
    flexDirection: "column",
    gap: 14,
  },
  listaCardsDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardListaPet: {
    width: "100%",
    backgroundColor: C.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  cardListaPetDesktop: {
    width: "48.8%",
  },
  cardListaTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgePerdido: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pontoPerdido: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#DC2626",
  },
  badgePerdidoTexto: {
    fontSize: 11,
    fontFamily: DS.font.bold,
    color: "#B91C1C",
  },
  tagCodigoLista: {
    fontSize: 11,
    fontFamily: DS.font.semibold,
    color: C.textMuted,
  },
  cardListaCorpo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarListaCirculo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  cardListaNome: {
    fontSize: 18,
    fontFamily: DS.font.bold,
    color: C.text,
  },
  cardListaSub: {
    fontSize: 12,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    marginTop: 1,
  },
  cardListaLocalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardListaLocalTexto: {
    flex: 1,
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.text,
  },
  cardListaResumo: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: DS.font.regular,
    color: C.textMuted,
  },
  botaoVerPetCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.blue,
    paddingVertical: 11,
    borderRadius: DS.radius.md,
  },
  botaoVerPetCardTexto: {
    fontSize: 13,
    fontFamily: DS.font.bold,
    color: COLORS.white,
  },

  /* ESTILOS DO PASSO 2: DETALHES DO PET */
  detalheWrapper: {
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
    gap: 14,
  },
  heroCard: {
    width: "100%",
    borderRadius: DS.radius.xl,
    padding: 18,
    gap: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tagBadgeHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagBadgeHeroTexto: {
    fontSize: 11,
    fontFamily: DS.font.bold,
    color: COLORS.white,
  },
  statusPerdidoHero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pontoPerdidoBranco: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  statusPerdidoHeroTexto: {
    fontSize: 10,
    fontFamily: DS.font.bold,
    color: COLORS.white,
  },
  heroPerfilRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarDetalheCirculo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  petNomeHero: {
    fontSize: 22,
    fontFamily: DS.font.bold,
    color: COLORS.white,
  },
  petRacaHero: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: "rgba(255,255,255,0.9)",
  },
  localHeroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  localHeroTexto: {
    flex: 1,
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: COLORS.yellow,
  },
  gradeAtributos: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 8,
  },
  itemAtributo: {
    width: "48.5%",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: DS.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  labelAtributo: {
    fontSize: 10,
    fontFamily: DS.font.bold,
    color: "rgba(255,255,255,0.75)",
  },
  valorAtributo: {
    fontSize: 13,
    fontFamily: DS.font.bold,
    color: COLORS.white,
    marginTop: 1,
  },
  acoesPrincipaisBox: {
    gap: 10,
  },
  botaoWhatsAppGrande: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: DS.radius.md,
  },
  botaoWhatsAppGrandeTexto: {
    fontSize: 15,
    fontFamily: DS.font.bold,
    color: COLORS.white,
  },
  botoesDuplosRow: {
    flexDirection: "row",
    gap: 10,
  },
  botaoSecundarioAcao: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: DS.radius.md,
  },
  botaoSecundarioAcaoTexto: {
    fontSize: 13,
    fontFamily: DS.font.bold,
    color: COLORS.blue,
  },
  botaoSecundarioLocalizacao: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EEF2FF",
    borderWidth: 1,
    borderColor: "#C7D2FE",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: DS.radius.md,
  },
  botaoSecundarioLocalizacaoTexto: {
    fontSize: 13,
    fontFamily: DS.font.bold,
    color: C.primary,
  },
  abasContainer: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 4,
    gap: 4,
  },
  abaItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: DS.radius.sm,
  },
  abaItemAtiva: {
    backgroundColor: "#EFF6FF",
  },
  abaTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.textMuted,
  },
  abaTextoAtivo: {
    color: COLORS.blue,
    fontFamily: DS.font.bold,
  },
  blocoConteudo: {
    gap: 14,
  },
  cardInfoSimples: {
    backgroundColor: C.surface,
    borderRadius: DS.radius.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 12,
  },
  tituloCardInterno: {
    fontSize: 15,
    fontFamily: DS.font.bold,
    color: C.text,
  },
  textoCardInterno: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: DS.font.regular,
    color: C.textMuted,
  },
  boxComportamento: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#EFF6FF",
    borderRadius: DS.radius.sm,
    padding: 12,
  },
  textoComportamento: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: DS.font.regular,
    color: COLORS.blue,
  },
  negrito: {
    fontFamily: DS.font.bold,
  },
  listaContatos: {
    gap: 10,
  },
  itemContato: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.bg,
    borderRadius: DS.radius.md,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    gap: 10,
  },
  itemContatoInfo: {
    flex: 1,
  },
  itemContatoRelacao: {
    fontSize: 11,
    fontFamily: DS.font.bold,
    color: C.textMuted,
  },
  itemContatoNome: {
    fontSize: 14,
    fontFamily: DS.font.bold,
    color: C.text,
    marginTop: 1,
  },
  itemContatoFone: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: COLORS.blue,
    marginTop: 2,
  },
  itemContatoBotoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniBotaoWhats: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    alignItems: "center",
    justifyContent: "center",
  },
  miniBotaoLigar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    alignItems: "center",
    justifyContent: "center",
  },
  inputObservacao: {
    height: 44,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: DS.radius.sm,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.text,
  },
  botaoEnviarGps: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.primary,
    paddingVertical: 13,
    borderRadius: DS.radius.md,
  },
  botaoEnviarGpsTexto: {
    fontSize: 14,
    fontFamily: DS.font.bold,
    color: COLORS.white,
  },
  feedbackBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: DS.radius.sm,
    borderWidth: 1,
  },
  feedbackSucesso: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  feedbackErro: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  feedbackTexto: {
    flex: 1,
    fontSize: 12,
    fontFamily: DS.font.semibold,
  },
  mapaHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkMapaCompleto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  linkMapaCompletoTexto: {
    fontSize: 12,
    fontFamily: DS.font.bold,
    color: C.primary,
  },
  mapaWrapper: {
    height: 200,
    width: "100%",
    borderRadius: DS.radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.border,
  },
  mapaPreview: {
    width: "100%",
    height: "100%",
  },
  resumoUltimaLeitura: {
    gap: 6,
  },
  enderecoLeitura: {
    fontSize: 13,
    fontFamily: DS.font.semibold,
    color: C.text,
  },
  dataLeitura: {
    fontSize: 11,
    fontFamily: DS.font.regular,
    color: C.textSubtle,
  },
  botaoAbrirRota: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 11,
    borderRadius: DS.radius.md,
  },
  botaoAbrirRotaTexto: {
    fontSize: 13,
    fontFamily: DS.font.bold,
    color: COLORS.blue,
  },
  chipsSaudeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipSaudeOk: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipSaudeOkTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: "#15803D",
  },
  chipSaudeInfo: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipSaudeInfoTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.text,
  },
  boxAlertaSaude: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: DS.radius.sm,
    padding: 12,
    gap: 4,
  },
  tituloAlertaSaude: {
    fontSize: 12,
    fontFamily: DS.font.bold,
    color: "#991B1B",
  },
  textoAlertaSaude: {
    fontSize: 12,
    fontFamily: DS.font.regular,
    color: "#7F1D1D",
  },
  itemFichaSimples: {
    backgroundColor: C.bg,
    borderRadius: DS.radius.sm,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    gap: 2,
  },
  labelFichaSimples: {
    fontSize: 11,
    fontFamily: DS.font.bold,
    color: C.textMuted,
  },
  valorFichaSimples: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: DS.font.regular,
    color: C.text,
  },
  boxVeterinario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: DS.radius.sm,
    padding: 12,
  },
  nomeVeterinario: {
    fontSize: 13,
    fontFamily: DS.font.bold,
    color: COLORS.blue,
    marginTop: 2,
  },
  foneVeterinario: {
    fontSize: 12,
    fontFamily: DS.font.regular,
    color: "#1E3A8A",
  },
  botaoLigarVet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  botaoLigarVetTexto: {
    fontSize: 12,
    fontFamily: DS.font.bold,
    color: COLORS.white,
  },
});
