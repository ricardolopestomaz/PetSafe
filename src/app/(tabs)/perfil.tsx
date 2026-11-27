import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PreferenciasTutorDTO, PREFERENCIAS_PADRAO } from "@/@types/auth";
import {
  CardBadgeContainer,
  Divider,
  HighlightCard,
  SquishyPressable,
  StaggerFadeItem,
} from "@/components/ds";
import PetCard from "@/components/PetCard";
import RodapeNav from "@/components/RodapeNav";
import * as AuthController from "@/controller/authController";
import { DS } from "@/global/themes";
import { usePerfilTutor } from "@/hooks/use-perfil-tutor";
import { usePets } from "@/hooks/use-pets";
import { supabase } from "@/lib/supabaseClient";
import { styles as home } from "@/styles/homeStyles";

const C = DS.colors;

function formatarData(iso?: string, comHora = false) {
  if (!iso) return "—";
  const data = new Date(iso);
  if (isNaN(data.getTime())) return "—";
  return comHora
    ? data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
}

function descreverAcesso(provedores: string[] = []) {
  const google = provedores.includes("google");
  const email = provedores.includes("email");
  if (google && email) return "E-mail e senha · Google";
  if (google) return "Conta Google";
  return "E-mail e senha";
}

/** Linha de informação de uma seção aberta (ícone · rótulo/valor · ação opcional). */
function LinhaInfo({
  icone,
  rotulo,
  valor,
  detalhe,
  onPress,
  direita,
  ultima,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  valor?: string;
  detalhe?: string;
  onPress?: () => void;
  direita?: ReactNode;
  ultima?: boolean;
}) {
  const conteudo = (
    <>
      <View style={s.linhaIcone}>
        <Ionicons name={icone} size={DS.icon.sm} color={C.text} />
      </View>
      <View style={s.linhaTextos}>
        <Text style={s.linhaRotulo}>{rotulo}</Text>
        {valor ? (
          <Text style={s.linhaValor} numberOfLines={1}>
            {valor}
          </Text>
        ) : null}
        {detalhe ? <Text style={s.linhaDetalhe}>{detalhe}</Text> : null}
      </View>
      {direita ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={18} color={C.textSubtle} />
        ) : null)}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        style={({ pressed }) => [
          s.linha,
          ultima && s.linhaUltima,
          pressed && s.pressed,
        ]}
      >
        {conteudo}
      </Pressable>
    );
  }
  return <View style={[s.linha, ultima && s.linhaUltima]}>{conteudo}</View>;
}

/** Título de seção no mesmo padrão da Home ("Meus Pets" + ação à direita). */
function TituloSecao({
  titulo,
  acao,
  iconeAcao,
  onAcao,
}: {
  titulo: string;
  acao?: string;
  iconeAcao?: keyof typeof Ionicons.glyphMap;
  onAcao?: () => void;
}) {
  return (
    <View style={home.headerAcoes}>
      <Text style={home.textoSecao}>{titulo}</Text>
      {acao && onAcao ? (
        <SquishyPressable
          style={home.adicionar}
          onPress={onAcao}
          iconAnimType={iconeAcao === "add" ? "rotate" : "slide"}
          accessibilityLabel={acao}
        >
          {({ iconStyle }) => (
            <View style={s.acaoSecao}>
              {iconeAcao ? (
                <Animated.View style={iconStyle}>
                  <Ionicons name={iconeAcao} size={DS.icon.sm} color={C.text} />
                </Animated.View>
              ) : null}
              <Text style={home.textoAdicionar}>{acao}</Text>
            </View>
          )}
        </SquishyPressable>
      ) : null}
    </View>
  );
}

export default function Perfil() {
  const { perfil, setPerfil, carregando, erro, recarregar } = usePerfilTutor();
  const {
    pets,
    loading: carregandoPets,
    error: erroPets,
    recarregar: recarregarPets,
  } = usePets();

  const [saindo, setSaindo] = useState(false);
  // Guarda a URL que falhou ao carregar; uma foto nova (outra URL) volta a ser exibida
  const [fotoComErro, setFotoComErro] = useState<string | null>(null);
  const [salvandoPreferencia, setSalvandoPreferencia] =
    useState<keyof PreferenciasTutorDTO | null>(null);

  // usePets já carrega ao montar; nos focos seguintes (ex.: voltando de /pet/novo) recarrega
  const primeiroFoco = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;
        return;
      }
      recarregarPets();
    }, [recarregarPets]),
  );

  // Entrada em cascata, como na Home
  const [animTopo] = useState(() => new Animated.Value(0));
  const [animCard] = useState(() => new Animated.Value(0));
  const [animSecoes] = useState(() => new Animated.Value(0));
  const pronto = !carregando && Boolean(perfil);

  useEffect(() => {
    if (!pronto) return;
    const anim = (valor: Animated.Value, duracao: number) =>
      Animated.timing(valor, {
        toValue: 1,
        duration: duracao,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    Animated.stagger(100, [
      anim(animTopo, 380),
      anim(animCard, 400),
      anim(animSecoes, 420),
    ]).start();
  }, [pronto, animTopo, animCard, animSecoes]);

  async function sair() {
    try {
      setSaindo(true);
      await supabase.auth.signOut();
      router.replace("/(auth)/login");
    } catch {
      Alert.alert("Erro", "Não foi possível encerrar a sessão.");
    } finally {
      setSaindo(false);
    }
  }

  function confirmarSaida() {
    // Alert.alert com botões não aparece na web (react-native-web)
    if (Platform.OS === "web") {
      if (globalThis.confirm?.("Deseja realmente sair do PetSafe?")) sair();
      return;
    }
    Alert.alert("Sair da conta", "Deseja realmente sair do PetSafe?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: sair },
    ]);
  }

  async function alternarPreferencia(
    chave: keyof PreferenciasTutorDTO,
    valor: boolean,
  ) {
    if (!perfil) return;
    const anteriores = perfil.preferencias ?? PREFERENCIAS_PADRAO;
    const novas = { ...anteriores, [chave]: valor };

    // Atualização otimista; desfaz se o Supabase recusar
    setPerfil({ ...perfil, preferencias: novas });
    setSalvandoPreferencia(chave);
    const resultado = await AuthController.salvarPreferencias(novas);
    setSalvandoPreferencia(null);

    if (!resultado.sucesso) {
      setPerfil((atual) =>
        atual ? { ...atual, preferencias: anteriores } : atual,
      );
      Alert.alert("Preferências", resultado.mensagem);
    }
  }

  /* ----------------------------- Estados ----------------------------- */

  if (carregando) {
    return (
      <SafeAreaView style={home.container}>
        <View style={s.centro}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
        <RodapeNav abaAtiva="perfil" />
      </SafeAreaView>
    );
  }

  if (!perfil) {
    return (
      <SafeAreaView style={home.container}>
        <View style={s.centro}>
          <View style={home.emptyIconCircle}>
            <Ionicons name="cloud-offline-outline" size={36} color={C.textSubtle} />
          </View>
          <Text style={s.estadoTitulo}>Não foi possível carregar seu perfil</Text>
          <Text style={home.emptyText}>
            {erro || "Verifique sua conexão e tente novamente."}
          </Text>
          <SquishyPressable style={s.botaoTentar} onPress={recarregar}>
            <Text style={s.botaoTentarTexto}>Tentar novamente</Text>
          </SquishyPressable>
        </View>
        <RodapeNav abaAtiva="perfil" />
      </SafeAreaView>
    );
  }

  const preferencias = perfil.preferencias ?? PREFERENCIAS_PADRAO;
  const inicial = perfil.nome.trim().charAt(0).toUpperCase() || "U";
  const mostrarFoto =
    Boolean(perfil.fotoPerfilUrl) && perfil.fotoPerfilUrl !== fotoComErro;
  const irParaEditar = () => router.push("/conta/editar" as any);

  const itensPreferencia: {
    chave: keyof PreferenciasTutorDTO;
    icone: keyof typeof Ionicons.glyphMap;
    rotulo: string;
    detalhe: string;
  }[] = [
    {
      chave: "alertaEscaneamentoPush",
      icone: "notifications-outline",
      rotulo: "Alertas no celular",
      detalhe: "Aviso quando a medalha de um pet for escaneada.",
    },
    {
      chave: "alertaEscaneamentoEmail",
      icone: "mail-outline",
      rotulo: "Alertas por e-mail",
      detalhe: "Resumo das leituras da medalha no seu e-mail.",
    },
    {
      chave: "novidadesPetSafe",
      icone: "megaphone-outline",
      rotulo: "Novidades e dicas",
      detalhe: "Comunicados do PetSafe sobre cuidados e recursos.",
    },
  ];

  return (
    <SafeAreaView style={home.container}>
      <ScrollView
        contentContainerStyle={home.conteudo}
        showsVerticalScrollIndicator={false}
      >
        {/* A. CABEÇALHO DO PERFIL */}
        <StaggerFadeItem animValue={animTopo}>
          <View style={home.topo}>
            <View style={home.saudacaoWrapper}>
              <Text style={home.saudacaoLabel}>Minha conta</Text>
              <Text style={home.titulo} numberOfLines={1}>
                Meu Perfil
              </Text>
            </View>
            <SquishyPressable
              onPress={irParaEditar}
              hitSlop={8}
              accessibilityLabel="Editar perfil"
              iconAnimType="rotate"
            >
              {({ iconStyle }) => (
                <View style={home.botaoSair}>
                  <Animated.View style={iconStyle}>
                    <Ionicons name="create-outline" size={DS.icon.md} color={C.text} />
                  </Animated.View>
                </View>
              )}
            </SquishyPressable>
          </View>
        </StaggerFadeItem>

        <StaggerFadeItem animValue={animCard}>
          {/* Único card de destaque da tela */}
          <HighlightCard contentStyle={s.cardPerfil} padding={28}>
            <View style={s.avatar}>
              {mostrarFoto ? (
                <Image
                  source={{ uri: perfil.fotoPerfilUrl }}
                  style={s.avatarFoto}
                  onError={() => setFotoComErro(perfil.fotoPerfilUrl ?? null)}
                  accessibilityLabel="Foto de perfil"
                />
              ) : (
                <Text style={s.avatarInicial}>{inicial}</Text>
              )}
            </View>
            <Text style={s.cardNome} numberOfLines={1}>
              {perfil.nome}
            </Text>
            <Text style={s.cardEmail} numberOfLines={1}>
              {perfil.email}
            </Text>

            <Pressable
              onPress={irParaEditar}
              accessibilityRole="button"
              accessibilityLabel="Editar perfil"
              style={({ pressed }) => pressed && s.pressed}
            >
              <CardBadgeContainer style={s.cardBotao}>
                <Ionicons name="create-outline" size={14} color={C.cardText} />
                <Text style={s.cardBotaoTexto}>Editar perfil</Text>
              </CardBadgeContainer>
            </Pressable>
          </HighlightCard>
        </StaggerFadeItem>

        <StaggerFadeItem animValue={animSecoes}>
          {/* B. INFORMAÇÕES PESSOAIS */}
          <TituloSecao
            titulo="Informações pessoais"
            acao="Editar"
            iconeAcao="create-outline"
            onAcao={irParaEditar}
          />
          <LinhaInfo icone="person-outline" rotulo="Nome completo" valor={perfil.nome} />
          <LinhaInfo
            icone="mail-outline"
            rotulo="E-mail"
            valor={perfil.email}
            detalhe={
              perfil.emailPendente
                ? `Aguardando confirmação de ${perfil.emailPendente}`
                : undefined
            }
          />
          <LinhaInfo
            icone="call-outline"
            rotulo="Telefone"
            valor={perfil.telefone || "Não informado"}
            ultima
          />

          {/* C. MEUS PETS */}
          <TituloSecao
            titulo="Meus Pets"
            acao="Adicionar"
            iconeAcao="add"
            onAcao={() => router.push("/pet/novo" as any)}
          />
          {carregandoPets ? (
            <View style={home.loading}>
              {[0, 1].map((i) => (
                <View key={i} style={home.skeletonRow}>
                  <View style={home.skeletonAvatar} />
                  <View style={home.skeletonLines}>
                    <View style={home.skeletonLineLg} />
                    <View style={home.skeletonLineSm} />
                  </View>
                </View>
              ))}
            </View>
          ) : erroPets ? (
            <View style={s.avisoPets}>
              <Text style={home.emptyText}>Não foi possível carregar seus pets.</Text>
              <Pressable onPress={recarregarPets} hitSlop={8}>
                <Text style={s.link}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : pets.length === 0 ? (
            <View style={s.avisoPets}>
              <View style={home.emptyIconCircle}>
                <Ionicons name="paw-outline" size={36} color={C.textSubtle} />
              </View>
              <Text style={home.emptyText}>Nenhum pet cadastrado ainda.</Text>
            </View>
          ) : (
            pets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onPress={() => router.push(`/pet/${pet.id}` as any)}
              />
            ))
          )}

          {/* D. SEGURANÇA DA CONTA */}
          <TituloSecao titulo="Segurança da conta" />
          <LinhaInfo
            icone="lock-closed-outline"
            rotulo={perfil.possuiSenha ? "Alterar senha" : "Criar senha"}
            detalhe={
              perfil.possuiSenha
                ? "Confirme a senha atual para definir uma nova."
                : "Sua conta usa o Google. Crie uma senha para entrar também por e-mail."
            }
            onPress={() => router.push("/conta/senha" as any)}
          />
          <LinhaInfo
            icone="key-outline"
            rotulo="Forma de acesso"
            valor={descreverAcesso(perfil.provedores)}
          />
          <LinhaInfo
            icone={perfil.emailConfirmado ? "shield-checkmark-outline" : "alert-circle-outline"}
            rotulo="Verificação de e-mail"
            valor={perfil.emailConfirmado ? "E-mail verificado" : "E-mail não verificado"}
          />
          <LinhaInfo
            icone="calendar-outline"
            rotulo="Membro desde"
            valor={formatarData(perfil.criadoEm)}
          />
          <LinhaInfo
            icone="time-outline"
            rotulo="Último acesso"
            valor={formatarData(perfil.ultimoAcessoEm, true)}
            ultima
          />

          {/* PRIVACIDADE: separa dados privados do que a medalha mostra */}
          <TituloSecao titulo="Privacidade" />
          <View style={s.privacidade}>
            <View style={s.privacidadeBloco}>
              <View style={s.privacidadeTopo}>
                <Ionicons name="eye-off-outline" size={DS.icon.sm} color={C.text} />
                <Text style={s.privacidadeTitulo}>Somente você vê</Text>
              </View>
              <Text style={s.privacidadeTexto}>
                E-mail, telefone da conta, endereço, senha e as informações de acesso
                desta página são privados.
              </Text>
            </View>
            <View style={s.privacidadeBloco}>
              <View style={s.privacidadeTopo}>
                <Ionicons name="qr-code-outline" size={DS.icon.sm} color={C.text} />
                <Text style={s.privacidadeTitulo}>Ao escanear a medalha</Text>
              </View>
              <Text style={s.privacidadeTexto}>
                Quem encontrar seu pet verá apenas os dados do pet e os contatos de
                emergência que você cadastrar para ele. Seus dados da conta não são
                exibidos.
              </Text>
            </View>
          </View>

          {/* E. PREFERÊNCIAS */}
          <TituloSecao titulo="Preferências" />
          {itensPreferencia.map((item, indice) => (
            <LinhaInfo
              key={item.chave}
              icone={item.icone}
              rotulo={item.rotulo}
              detalhe={item.detalhe}
              ultima={indice === itensPreferencia.length - 1}
              direita={
                <Switch
                  value={preferencias[item.chave]}
                  onValueChange={(valor) => alternarPreferencia(item.chave, valor)}
                  disabled={salvandoPreferencia !== null}
                  trackColor={{ false: C.divider, true: C.primary }}
                  thumbColor={C.surface}
                  accessibilityLabel={item.rotulo}
                />
              }
            />
          ))}
          <Text style={s.nota}>
            O envio de alertas está em desenvolvimento. Suas escolhas já ficam salvas
            na sua conta e serão aplicadas quando o recurso for lançado.
          </Text>

          {/* SAIR */}
          <View style={s.blocoSair}>
            <Divider />
            <Pressable
              style={({ pressed }) => [
                s.sair,
                pressed && s.pressed,
                saindo && s.desabilitado,
              ]}
              onPress={confirmarSaida}
              disabled={saindo}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
            >
              {saindo ? (
                <ActivityIndicator size="small" color={C.danger} />
              ) : (
                <Ionicons name="log-out-outline" size={DS.icon.md} color={C.danger} />
              )}
              <Text style={s.sairTexto}>{saindo ? "Saindo..." : "Sair da conta"}</Text>
            </Pressable>
            <Divider />
          </View>
        </StaggerFadeItem>
      </ScrollView>

      <RodapeNav abaAtiva="perfil" />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  estadoTitulo: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: DS.font.semibold,
    color: C.text,
    textAlign: "center",
  },
  botaoTentar: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: C.primary,
  },
  botaoTentarTexto: {
    color: C.primaryText,
    fontFamily: DS.font.semibold,
    fontSize: 14,
  },
  pressed: { opacity: 0.6 },
  desabilitado: { opacity: 0.5 },

  /* Card de destaque */
  cardPerfil: { alignItems: "center" },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.cardAlt,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 14,
  },
  avatarFoto: { width: "100%", height: "100%" },
  avatarInicial: {
    fontSize: 32,
    fontFamily: DS.font.bold,
    color: C.cardText,
  },
  cardNome: {
    fontSize: 20,
    fontFamily: DS.font.bold,
    color: C.cardText,
    letterSpacing: -0.4,
  },
  cardEmail: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.cardTextMuted,
    marginTop: 2,
  },
  cardBotao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  cardBotaoTexto: {
    fontSize: 12,
    fontFamily: DS.font.semibold,
    color: C.cardText,
  },

  /* Seções abertas */
  acaoSecao: { flexDirection: "row", alignItems: "center", gap: 4 },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.divider,
  },
  linhaUltima: { borderBottomWidth: 0 },
  linhaIcone: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  linhaTextos: { flex: 1 },
  linhaRotulo: {
    fontSize: 14,
    fontFamily: DS.font.semibold,
    color: C.text,
  },
  linhaValor: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    marginTop: 1,
  },
  linhaDetalhe: {
    fontSize: 12,
    fontFamily: DS.font.regular,
    color: C.textSubtle,
    marginTop: 2,
  },
  avisoPets: { alignItems: "center", paddingVertical: 24 },
  link: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: DS.font.semibold,
    color: C.primary,
  },

  /* Privacidade */
  privacidade: { gap: 12, paddingTop: 14 },
  privacidadeBloco: {
    padding: 16,
    borderRadius: DS.radius.md,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    gap: 6,
  },
  privacidadeTopo: { flexDirection: "row", alignItems: "center", gap: 8 },
  privacidadeTitulo: {
    fontSize: 14,
    fontFamily: DS.font.semibold,
    color: C.text,
  },
  privacidadeTexto: {
    fontSize: 13,
    fontFamily: DS.font.regular,
    color: C.textMuted,
    lineHeight: 19,
  },

  nota: {
    fontSize: 12,
    fontFamily: DS.font.regular,
    color: C.textSubtle,
    marginTop: 4,
    lineHeight: 18,
  },

  /* Sair */
  blocoSair: { marginTop: 32 },
  sair: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
  },
  sairTexto: {
    color: C.danger,
    fontFamily: DS.font.semibold,
    fontSize: 15,
  },
});
