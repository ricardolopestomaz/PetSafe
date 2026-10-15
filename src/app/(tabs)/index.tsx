import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";

import { COLORS } from "@/global/themes";
import { listarMeusPets, Pet } from "@/services/pets";
import { styles } from "@/styles/homeStyles";

// Importação dos banners em PNG
import Banner1 from "@/assets/banners/banner1.png";
import Banner2 from "@/assets/banners/banner2.png";
import Banner3 from "@/assets/banners/banner3.png";
import Banner4 from "@/assets/banners/banner4.png";
import * as AuthController from "@/controller/authController";

const banners = [
  {
    imagem: Banner1,
    titulo: "Sua Tag ID inteligente sempre ativa.",
    subtitulo: "Conecte a identificação do seu pet com um clique.",
  },
  {
    imagem: Banner2,
    titulo: "Histórico de leituras em tempo real.",
    subtitulo: "Saiba exatamente onde e quando a medalha foi lida.",
  },
  {
    imagem: Banner3,
    titulo: "Saúde e vacinas organizadas.",
    subtitulo: "Histórico médico e lembretes sempre à mão.",
  },
  {
    imagem: Banner4,
    titulo: "Assistente inteligente 24 horas.",
    subtitulo: "Tire dúvidas sobre cuidados e bem-estar do pet.",
  },
];

export default function Home() {
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [abaAtiva, setAbaAtiva] = useState("home");
  const [filtroAtivo, setFiltroAtivo] = useState("pets");

  // Estado dos Pets
  const [pets, setPets] = useState<Pet[]>([]);
  const [carregandoPets, setCarregandoPets] = useState(true);

  const [opacidade] = useState(() => new Animated.Value(1));

  // Carrega pets da API
  async function carregarPets() {
    try {
      const data = await listarMeusPets();
      setPets(data || []);
    } catch {
      setPets([]);
    } finally {
      setCarregandoPets(false);
    }
  }

  // Carrega dados do usuário autenticado
  async function carregarUsuario() {
    try {
      const usuario = await AuthController.carregarUsuarioAtual();
      if (usuario?.nome) {
        setNomeUsuario(usuario.nome);
      }
    } catch {
      // Mantém fallback 'Usuário'
    }
  }

  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      await Promise.all([
        carregarUsuario(),
        carregarPets(),
      ]);
    }

    if (ativo) {
      inicializar();
    }

    return () => {
      ativo = false;
    };
  }, []);

  // Animação de Fade automática dos banners
  useEffect(() => {
    const intervalo = setInterval(() => {
      Animated.timing(opacidade, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIndiceAtual((prev) => (prev === banners.length - 1 ? 0 : prev + 1));

        Animated.timing(opacidade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 4000);

    return () => clearInterval(intervalo);
  }, [opacidade]);

  const primeiroNome = nomeUsuario ? nomeUsuario.trim().split(" ")[0] : "Usuário";

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filtroAtivo === "pets" ? pets : []}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* NOME DINÂMICO */}
            <Text style={styles.titulo}>Olá, {primeiroNome}!</Text>

            <View style={styles.bannerWrapper}>
              <Animated.View
                style={[styles.bannerContainer, { opacity: opacidade }]}
              >
                <Image
                  source={banners[indiceAtual].imagem}
                  style={styles.imagemBanner}
                  resizeMode="cover"
                />

                <View style={styles.textoBanner}>
                  <Text style={styles.tituloBanner} numberOfLines={2}>
                    {banners[indiceAtual].titulo}
                  </Text>
                  <Text style={styles.subtituloBanner} numberOfLines={2}>
                    {banners[indiceAtual].subtitulo}
                  </Text>
                </View>
              </Animated.View>
            </View>

            {/* INDICADORES DO CARROSSEL */}
            <View style={styles.indicadores}>
              {banners.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicador,
                    index === indiceAtual && styles.indicadorAtivo,
                  ]}
                />
              ))}
            </View>

            {/* FILTROS HORIZONTAIS COM SCROLL */}
            <View style={styles.scrollWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.containerBotoesScroll}
              >
                <TouchableOpacity
                  style={
                    filtroAtivo === "pets" ? styles.botaoAtivo : styles.botao
                  }
                  onPress={() => setFiltroAtivo("pets")}
                >
                  <Text
                    style={
                      filtroAtivo === "pets"
                        ? styles.textoBotaoAtivo
                        : styles.textoBotao
                    }
                  >
                    Meus Pets
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    filtroAtivo === "historico"
                      ? styles.botaoAtivo
                      : styles.botao
                  }
                  onPress={() => setFiltroAtivo("historico")}
                >
                  <Text
                    style={
                      filtroAtivo === "historico"
                        ? styles.textoBotaoAtivo
                        : styles.textoBotao
                    }
                  >
                    Histórico de Escaneamento
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    filtroAtivo === "outro" ? styles.botaoAtivo : styles.botao
                  }
                  onPress={() => setFiltroAtivo("outro")}
                >
                  <Text
                    style={
                      filtroAtivo === "outro"
                        ? styles.textoBotaoAtivo
                        : styles.textoBotao
                    }
                  >
                    Parcerias
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* CABEÇALHO DA SEÇÃO DE PETS */}
            {filtroAtivo === "pets" && (
              <View style={styles.headerAcoes}>
                <Text style={styles.textoSecao}>Meus Pets</Text>
                <TouchableOpacity
                  style={styles.adicionar}
                  onPress={() => router.push("/pet/novo" as any)}
                >
                  <Text style={styles.textoAdicionar}>+ Adicionar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* LOADING STATE DA LISTA */}
            {filtroAtivo === "pets" && carregandoPets && (
              <ActivityIndicator
                size="large"
                color={COLORS.blue}
                style={styles.loading}
              />
            )}

            {/* EMPTY STATE DA LISTA */}
            {filtroAtivo === "pets" && !carregandoPets && pets.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="paw-outline"
                  size={64}
                  color={COLORS.placeholder || "#999999"}
                />
                <Text style={styles.emptyText}>
                  Nenhum pet cadastrado ainda.
                </Text>
              </View>
            )}

            {filtroAtivo !== "pets" && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Em breve...</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          if (filtroAtivo !== "pets") return null;

          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/pet/${item.id}` as any)}
            >
              <View style={styles.cardInfo}>
                <Text style={styles.petName}>{item.nome}</Text>
                <Text style={styles.petDetails}>
                  {item.especie} • {item.raca || "Sem raça definida"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.blue} />
            </Pressable>
          );
        }}
      />

      {/* NAVEGAÇÃO INFERIOR (BOTTOM BAR) */}
      <View style={styles.rodape}>
        <TouchableOpacity
          style={styles.itemRodape}
          onPress={() => setAbaAtiva("home")}
        >
          <Octicons
            name="home"
            size={20}
            color={abaAtiva === "home" ? COLORS.yellow : COLORS.cinzaclaro}
          />
          {abaAtiva === "home" && <View style={styles.tracoAtivo} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemRodape}
          onPress={() => setAbaAtiva("ai")}
        >
          <MaterialCommunityIcons
            name="robot"
            size={20}
            color={abaAtiva === "ai" ? COLORS.yellow : COLORS.cinzaclaro}
          />
          {abaAtiva === "ai" && <View style={styles.tracoAtivo} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemRodape}
          onPress={() => setAbaAtiva("scanner")}
        >
          <Ionicons
            name="qr-code-outline"
            size={20}
            color={abaAtiva === "scanner" ? COLORS.yellow : COLORS.cinzaclaro}
          />
          {abaAtiva === "scanner" && <View style={styles.tracoAtivo} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemRodape}
          onPress={() => setAbaAtiva("chat")}
        >
          <Ionicons
            name="chatbubble-outline"
            size={20}
            color={abaAtiva === "chat" ? COLORS.yellow : COLORS.cinzaclaro}
          />
          {abaAtiva === "chat" && <View style={styles.tracoAtivo} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemRodape}
          onPress={() => setAbaAtiva("pets")}
        >
          <FontAwesome5
            name="paw"
            size={20}
            color={abaAtiva === "pets" ? COLORS.yellow : COLORS.cinzaclaro}
          />
          {abaAtiva === "pets" && <View style={styles.tracoAtivo} />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
