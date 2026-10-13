import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import { router } from "expo-router";
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

import { COLORS } from "@/global/themes";
import { listarMeusPets, Pet } from "@/services/pets";
import { Leitura, listarTodasLeituras } from "@/services/leituras";
import { styles } from "@/styles/homeStyles";

// Importação dos banners em PNG
import Banner1 from "@/assets/banners/banner1.png";
import Banner2 from "@/assets/banners/banner2.png";
import Banner3 from "@/assets/banners/banner3.png";
import Banner4 from "@/assets/banners/banner4.png";

// Hook de exemplo para obter o utilizador autenticado
// Na vida real você pegaria isso do seu contexto de Auth ou Supabase
const useUser = () => {
  return { name: "Usuário" };
};

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
  const { name } = useUser();
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [abaAtiva, setAbaAtiva] = useState("home");
  const [filtroAtivo, setFiltroAtivo] = useState("pets");

  // Estado dos Pets
  const [pets, setPets] = useState<Pet[]>([]);
  const [carregandoPets, setCarregandoPets] = useState(true);

  // Estado das Leituras
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [carregandoLeituras, setCarregandoLeituras] = useState(false);

  const [opacidade] = useState(() => new Animated.Value(1));

  // Carrega pets da API
  async function carregarPets() {
    try {
      setCarregandoPets(true);
      const data = await listarMeusPets();
      setPets(data || []);
    } catch {
      setPets([]);
    } finally {
      setCarregandoPets(false);
    }
  }

  // Carrega histórico de escaneamentos
  async function carregarLeituras() {
    try {
      setCarregandoLeituras(true);
      const data = await listarTodasLeituras();
      setLeituras(data || []);
    } catch {
      setLeituras([]);
    } finally {
      setCarregandoLeituras(false);
    }
  }

  useEffect(() => {
    Promise.resolve().then(() => {
      carregarPets();
      carregarLeituras();
    });
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

  const primeiroNome = name ? name.split(" ")[0] : "Usuário";

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={
          filtroAtivo === "pets"
            ? (pets as any[])
            : filtroAtivo === "historico"
            ? (leituras as any[])
            : []
        }
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* NOME DINÂMICO */}
            <Text style={styles.titulo}>Olá, {primeiroNome}!</Text>

            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.bannerWrapper}
              onPress={() => {
                if (indiceAtual === 1) {
                  router.push("/mapa" as any);
                }
              }}
            >
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
            </TouchableOpacity>

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
                  onPress={() => {
                    setFiltroAtivo("historico");
                    carregarLeituras();
                  }}
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

            {/* CABEÇALHO DO HISTÓRICO DE LEITURAS */}
            {filtroAtivo === "historico" && (
              <>
                <View style={styles.headerAcoes}>
                  <Text style={styles.textoSecao}>Leituras das Medalhas</Text>
                  <TouchableOpacity
                    style={styles.adicionar}
                    onPress={() => router.push("/mapa" as any)}
                  >
                    <Text style={styles.textoAdicionar}>Ver no Mapa 🗺️</Text>
                  </TouchableOpacity>
                </View>

                {/* BANNER DE ACESSO AO MAPA */}
                <TouchableOpacity
                  style={styles.bannerMapaBotao}
                  onPress={() => router.push("/mapa" as any)}
                >
                  <View style={styles.bannerMapaIconeTexto}>
                    <Ionicons name="map" size={24} color={COLORS.blue} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bannerMapaTitulo}>
                        Mapa Interativo de Leituras
                      </Text>
                      <Text style={styles.bannerMapaSubtitulo}>
                        Explore todos os locais onde as tags foram lidas
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.blue} />
                </TouchableOpacity>
              </>
            )}

            {/* LOADING STATE DA LISTA */}
            {filtroAtivo === "pets" && carregandoPets && (
              <ActivityIndicator
                size="large"
                color={COLORS.blue}
                style={styles.loading}
              />
            )}

            {filtroAtivo === "historico" && carregandoLeituras && (
              <ActivityIndicator
                size="large"
                color={COLORS.blue}
                style={styles.loading}
              />
            )}

            {/* EMPTY STATE DA LISTA DE PETS */}
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

            {/* EMPTY STATE DE HISTÓRICO */}
            {filtroAtivo === "historico" &&
              !carregandoLeituras &&
              leituras.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="location-outline"
                    size={64}
                    color={COLORS.placeholder || "#999999"}
                  />
                  <Text style={styles.emptyText}>
                    Nenhuma leitura registrada ainda.
                  </Text>
                </View>
              )}

            {filtroAtivo === "outro" && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Em breve...</Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }) => {
          if (filtroAtivo === "pets") {
            const pet = item as Pet;
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/pet/${pet.id}` as any)}
              >
                <View style={styles.cardInfo}>
                  <Text style={styles.petName}>{pet.nome}</Text>
                  <Text style={styles.petDetails}>
                    {pet.especie} • {pet.raca || "Sem raça definida"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.blue} />
              </Pressable>
            );
          }

          if (filtroAtivo === "historico") {
            const leitura = item as Leitura;
            return (
              <Pressable
                style={styles.cardLeitura}
                onPress={() =>
                  router.push({
                    pathname: "/mapa" as any,
                    params: { petId: leitura.pet_id },
                  })
                }
              >
                <View style={styles.cardLeituraIcone}>
                  <MaterialCommunityIcons
                    name="paw"
                    size={18}
                    color={COLORS.blue}
                  />
                </View>
                <View style={styles.cardLeituraInfo}>
                  <Text style={styles.cardLeituraPet}>
                    {leitura.pet?.nome || "Medalha PetSafe"}
                  </Text>
                  <Text style={styles.cardLeituraEndereco} numberOfLines={1}>
                    {leitura.endereco_aproximado ||
                      `${leitura.bairro || ""} ${leitura.cidade || ""}`.trim() ||
                      `Lat: ${leitura.latitude.toFixed(4)}, Long: ${leitura.longitude.toFixed(4)}`}
                  </Text>
                  <Text style={styles.cardLeituraData}>
                    {new Date(leitura.criado_em).toLocaleString("pt-BR")}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={COLORS.blue}
                />
              </Pressable>
            );
          }

          return null;
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
          onPress={() => {
            setAbaAtiva("scanner");
            router.push("/mapa" as any);
          }}
        >
          <Ionicons
            name="map-outline"
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
