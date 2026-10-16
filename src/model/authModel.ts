import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabaseClient';
import { PerfilUsuarioDTO } from '@/@types/auth';

WebBrowser.maybeCompleteAuthSession();

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

export async function loginComGoogle() {
  try {
    const redirectUrl = Linking.createURL('auth-callback');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      const msg = error?.message || '';
      if (
        msg.toLowerCase().includes('provider is not enabled') ||
        msg.toLowerCase().includes('unsupported provider')
      ) {
        return {
          sucesso: false,
          mensagem:
            'O login com o Google ainda não foi ativado no painel do Supabase. Vá em "Authentication" > "Providers" > "Google" e ative o provedor.',
        };
      }
      return {
        sucesso: false,
        mensagem: error?.message || 'Não foi possível iniciar o login com o Google.',
      };
    }

    const resultado = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (resultado.type === 'success' && resultado.url) {
      const urlCompleta = resultado.url;
      const hashPart = urlCompleta.split('#')[1];
      const searchPart = urlCompleta.split('?')[1];
      const params = new URLSearchParams(hashPart || searchPart || '');

      // 1. Verifica se houve erro retornado pelo Supabase ou Google
      const errorDesc = params.get('error_description') || params.get('error');
      if (errorDesc) {
        const descDecodificada = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
        if (
          descDecodificada.toLowerCase().includes('redirect_uri') ||
          descDecodificada.toLowerCase().includes('not_whitelisted') ||
          descDecodificada.toLowerCase().includes('redirect url')
        ) {
          return {
            sucesso: false,
            mensagem: `URL de retorno não autorizada no Supabase (${redirectUrl}). Adicione "${redirectUrl}", "exp://**" e "petsafefront://**" nas "Redirect URLs" do painel do Supabase.`,
          };
        }
        return {
          sucesso: false,
          mensagem: descDecodificada,
        };
      }

      // 2. Fluxo PKCE (padrão Supabase v2): troca o código de autorização por sessão
      const code = params.get('code');
      if (code) {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
          return { sucesso: false, mensagem: sessionError.message };
        }

        if (sessionData?.user) {
          await sincronizarUsuario(sessionData.user);
        }

        return { sucesso: true, data: sessionData };
      }

      // 3. Fluxo Implícito (caso venham tokens diretamente)
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

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
    }

    if (resultado.type === 'cancel' || resultado.type === 'dismiss') {
      return { sucesso: false, mensagem: 'Login com Google cancelado.' };
    }

    return { sucesso: false, mensagem: 'Não foi possível concluir o login com Google.' };
  } catch (err: any) {
    return {
      sucesso: false,
      mensagem: err?.message || 'Erro inesperado no login com Google.',
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
      'Usuário';

    const fotoPerfil =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null;

    await supabase.from('usuarios').upsert(
      {
        id: user.id,
        nome,
        email: user.email,
        foto_perfil_url: fotoPerfil,
      },
      { onConflict: 'id' }
    );
  } catch {
    // Ignora erro de inserção se houver bloqueio de RLS não crítico
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
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (perfil) {
      nome = perfil.nome || nome;
      fotoPerfilUrl = perfil.foto_perfil_url || fotoPerfilUrl;
      telefone = perfil.telefone || telefone;
    }
  } catch {
    // Caso a tabela não esteja acessível, mantém dados do Auth
  }

  return {
    id: user.id,
    email: user.email || '',
    nome: nome || 'Usuário',
    fotoPerfilUrl,
    telefone,
  };
}
