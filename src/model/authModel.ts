import {
  AtualizarPerfilPayload,
  PerfilUsuarioDTO,
  PREFERENCIAS_PADRAO,
  PreferenciasTutorDTO,
} from "@/@types/auth";
import { supabase } from "@/lib/supabaseClient";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export type ResultadoOAuth = {
  sucesso: boolean;
  mensagem?: string;
  data?: any;
  redirecionando?: boolean;
};

// Evita troca duplicada do mesmo código PKCE (ex.: React Strict Mode em dev
// ou fallback simultâneo de deep link).
const promessasPorCodigo = new Map<string, Promise<ResultadoOAuth>>();

function extrairParametrosOAuth(urlCompleta: string) {
  const hashPart = urlCompleta.split("#")[1] ?? "";
  const searchPart = (urlCompleta.split("?")[1] ?? "").split("#")[0] ?? "";
  const hashParams = new URLSearchParams(hashPart);
  const searchParams = new URLSearchParams(searchPart);

  const obter = (chave: string) =>
    searchParams.get(chave) || hashParams.get(chave);

  return {
    errorDesc: obter("error_description") || obter("error"),
    code: obter("code"),
    accessToken: obter("access_token"),
    refreshToken: obter("refresh_token"),
  };
}

export async function concluirLoginOAuthPorUrl(
  urlCompleta: string,
  redirectUrl?: string,
): Promise<ResultadoOAuth> {
  const { errorDesc, code, accessToken, refreshToken } =
    extrairParametrosOAuth(urlCompleta);

  // 1. Verifica se houve erro retornado pelo Supabase ou Google
  if (errorDesc) {
    const descDecodificada = decodeURIComponent(errorDesc.replace(/\+/g, " "));
    if (
      descDecodificada.toLowerCase().includes("provider is not enabled") ||
      descDecodificada.toLowerCase().includes("unsupported provider")
    ) {
      return {
        sucesso: false,
        mensagem:
          'O login com o Google ainda não foi ativado no painel do Supabase. Vá em "Authentication" > "Providers" > "Google" e ative o provedor.',
      };
    }
    if (
      descDecodificada.toLowerCase().includes("redirect_uri") ||
      descDecodificada.toLowerCase().includes("not_whitelisted") ||
      descDecodificada.toLowerCase().includes("redirect url")
    ) {
      const destino = redirectUrl || Linking.createURL("auth-callback");
      return {
        sucesso: false,
        mensagem: `URL de retorno não autorizada no Supabase (${destino}). Adicione "${destino}", "exp://**" e "petsafefront://**" nas "Redirect URLs" do painel do Supabase.`,
      };
    }
    return {
      sucesso: false,
      mensagem: descDecodificada,
    };
  }

  // 2. Fluxo PKCE (padrão Supabase v2): troca o código de autorização por sessão
  if (code) {
    const emAndamento = promessasPorCodigo.get(code);
    if (emAndamento) {
      return emAndamento;
    }

    const promessa: Promise<ResultadoOAuth> = (async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        // Caso outra chamada já tenha concluído a troca e salvo a sessão
        const { data: atual } = await supabase.auth.getSession();
        if (atual.session?.user) {
          await sincronizarUsuario(atual.session.user);
          return { sucesso: true, data: atual };
        }
        return { sucesso: false, mensagem: sessionError.message };
      }

      if (sessionData?.user) {
        await sincronizarUsuario(sessionData.user);
      }

      return { sucesso: true, data: sessionData };
    })();

    promessasPorCodigo.set(code, promessa);
    try {
      return await promessa;
    } finally {
      setTimeout(() => promessasPorCodigo.delete(code), 30_000);
    }
  }

  // 3. Fluxo Implícito (caso venham tokens diretamente no fragmento #)
  if (accessToken && refreshToken) {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (sessionError) {
      return { sucesso: false, mensagem: sessionError.message };
    }

    if (sessionData?.user) {
      await sincronizarUsuario(sessionData.user);
    }

    return { sucesso: true, data: sessionData };
  }

  // 4. Fallback: usuário recarregou /auth-callback com sessão já ativa
  const { data: sessaoExistente } = await supabase.auth.getSession();
  if (sessaoExistente.session?.user) {
    await sincronizarUsuario(sessaoExistente.session.user);
    return { sucesso: true, data: sessaoExistente };
  }

  return {
    sucesso: false,
    mensagem: "Não foi possível concluir o login com Google.",
  };
}

export async function login(email: string, senha: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return { sucesso: false, mensagem: error.message };
  }

  // Sincroniza/garante o perfil na tabela usuarios
  if (data.user) {
    await sincronizarUsuario(data.user);
  }

  return { sucesso: true, data };
}

export async function loginComGoogle(): Promise<ResultadoOAuth> {
  try {
    const redirectUrl = Linking.createURL("auth-callback");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      const msg = error?.message || "";
      if (
        msg.toLowerCase().includes("provider is not enabled") ||
        msg.toLowerCase().includes("unsupported provider")
      ) {
        return {
          sucesso: false,
          mensagem:
            'O login com o Google ainda não foi ativado no painel do Supabase. Vá em "Authentication" > "Providers" > "Google" e ative o provedor.',
        };
      }
      return {
        sucesso: false,
        mensagem:
          error?.message || "Não foi possível iniciar o login com o Google.",
      };
    }

    // Na Web, redireciona na própria aba para evitar bloqueio de popups e falhas de COOP.
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.assign(data.url);
      return { sucesso: true, redirecionando: true };
    }

    const resultado = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUrl,
    );

    if (resultado.type === "success" && resultado.url) {
      return await concluirLoginOAuthPorUrl(resultado.url, redirectUrl);
    }

    if (resultado.type === "cancel" || resultado.type === "dismiss") {
      return { sucesso: false, mensagem: "Login com Google cancelado." };
    }

    return {
      sucesso: false,
      mensagem: "Não foi possível concluir o login com Google.",
    };
  } catch (err: any) {
    return {
      sucesso: false,
      mensagem: err?.message || "Erro inesperado no login com Google.",
    };
  }
}

export async function cadastrar(nome: string, email: string, senha: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome,
        full_name: nome,
      },
    },
  });

  if (error) {
    return { sucesso: false, mensagem: error.message };
  }

  if (data.user) {
    await sincronizarUsuario(data.user, nome);
  }

  return { sucesso: true, data };
}

export async function atualizarSenha(novaSenha: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: novaSenha,
  });

  if (error) {
    return { sucesso: false, mensagem: error.message };
  }

  return { sucesso: true, data };
}

export async function sincronizarUsuario(user: any, nomeFallback?: string) {
  try {
    const nome =
      user.user_metadata?.nome ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      nomeFallback ||
      "Usuário";

    const fotoPerfil =
      user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

    const { data: existente } = await supabase
      .from("usuarios")
      .select("id, nome, foto_perfil_url")
      .eq("id", user.id)
      .maybeSingle();

    let error;

    if (!existente) {
      // Primeiro acesso: cria o perfil com os dados do Auth/Google
      const registro: Record<string, any> = {
        id: user.id,
        nome,
        email: user.email,
      };
      if (fotoPerfil) registro.foto_perfil_url = fotoPerfil;

      ({ error } = await supabase.from("usuarios").insert(registro));
    } else {
      // Perfil já existe: NÃO sobrescreve nome/foto editados pelo tutor no app.
      // Só mantém o e-mail em dia (pode ter mudado após confirmação) e
      // preenche nome/foto se ainda estiverem vazios.
      const atualizacao: Record<string, any> = { email: user.email };
      if (!existente.nome) atualizacao.nome = nome;
      if (!existente.foto_perfil_url && fotoPerfil) {
        atualizacao.foto_perfil_url = fotoPerfil;
      }

      ({ error } = await supabase
        .from("usuarios")
        .update(atualizacao)
        .eq("id", user.id));
    }

    if (error) {
      console.warn(
        "[sincronizarUsuario] Falha ao gravar em usuarios:",
        error.message,
      );
    }
  } catch (err) {
    console.warn("[sincronizarUsuario] Erro inesperado:", err);
  }
}

export async function obterUsuarioAtual(): Promise<PerfilUsuarioDTO | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  let nome =
    user.user_metadata?.nome ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name;
  let fotoPerfilUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;
  let telefone = user.user_metadata?.telefone;

  try {
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (perfil) {
      nome = perfil.nome || nome;
      fotoPerfilUrl = perfil.foto_perfil_url || fotoPerfilUrl;
      telefone = perfil.telefone || telefone;
    }
  } catch {
    // Caso a tabela não esteja acessível, mantém dados do Auth
  }

  const provedores: string[] = Array.from(
    new Set(
      (user.identities ?? []).map((identidade) => identidade.provider),
    ),
  );
  if (provedores.length === 0 && user.app_metadata?.provider) {
    provedores.push(user.app_metadata.provider);
  }

  return {
    id: user.id,
    email: user.email || "",
    nome: nome || "Usuário",
    fotoPerfilUrl,
    telefone,
    criadoEm: user.created_at,
    ultimoAcessoEm: user.last_sign_in_at,
    emailConfirmado: Boolean(user.email_confirmed_at),
    emailPendente: user.new_email || undefined,
    provedores,
    possuiSenha: provedores.includes("email"),
    preferencias: {
      ...PREFERENCIAS_PADRAO,
      ...(user.user_metadata?.preferencias ?? {}),
    },
  };
}

// Atualiza os dados pessoais do tutor logado em public.usuarios.
// O filtro por id + RLS garantem que só a própria linha é alterada.
export async function atualizarPerfil(dados: AtualizarPerfilPayload) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { sucesso: false, mensagem: "Sessão expirada. Entre novamente." };
  }

  const { data, error } = await supabase
    .from("usuarios")
    .update({
      nome: dados.nome,
      telefone: dados.telefone,
      foto_perfil_url: dados.fotoPerfilUrl,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return { sucesso: false, mensagem: error.message };
  }
  if (!data) {
    // Nenhuma linha atualizada: perfil inexistente ou bloqueado pela RLS
    return {
      sucesso: false,
      mensagem: "Não foi possível encontrar seu perfil para atualizar.",
    };
  }

  // Mantém o nome do Auth em dia (usado como fallback em outras telas)
  await supabase.auth.updateUser({ data: { nome: dados.nome } });

  return { sucesso: true };
}

// Solicita a troca de e-mail. O Supabase envia um link de confirmação;
// o e-mail só muda de fato depois que o tutor confirma.
export async function solicitarTrocaEmail(novoEmail: string) {
  const { error } = await supabase.auth.updateUser(
    { email: novoEmail },
    { emailRedirectTo: Linking.createURL("/perfil") },
  );

  if (error) {
    return { sucesso: false, mensagem: error.message };
  }
  return { sucesso: true };
}

// Confere a senha atual antes de permitir a troca
export async function verificarSenha(email: string, senha: string) {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });
  return !error;
}

export async function salvarPreferencias(preferencias: PreferenciasTutorDTO) {
  const { error } = await supabase.auth.updateUser({
    data: { preferencias },
  });

  if (error) {
    return { sucesso: false, mensagem: error.message };
  }
  return { sucesso: true };
}
