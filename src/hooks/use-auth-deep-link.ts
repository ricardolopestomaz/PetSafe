import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';

import {
  finalizarRecuperacaoSenha,
  iniciarRecuperacaoSenha,
} from '@/lib/recuperacaoSenha';
import { supabase } from '@/lib/supabaseClient';

function extrairTokensDaUrl(url: string) {
  const hashPart = url.split('#')[1];
  const searchPart = url.split('?')[1];
  const queryString = hashPart || searchPart;

  if (!queryString) {
    return null;
  }

  const params = new URLSearchParams(queryString);

  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const code = params.get('code');
  const type = params.get('type');

  if (code) {
    return { code, type };
  }

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken, type };
}

// É recuperação quando o Supabase manda type=recovery (fluxo implícito)
// ou quando o link aponta para a tela redefinir_senha (fluxo PKCE, que só traz ?code=)
function ehLinkDeRecuperacao(url: string, type: string | null) {
  if (type === 'recovery') return true;
  const caminho = url.split(/[?#]/)[0];
  return caminho.includes('redefinir_senha');
}

async function tratarUrl(url: string | null) {
  if (!url) {
    return;
  }

  // O retorno do login com Google em /auth-callback é processado pela própria
  // tela src/app/auth-callback.tsx (Web) ou pelo openAuthSessionAsync (Mobile),
  // evitando dupla troca do código PKCE de uso único.
  const caminho = url.split(/[?#]/)[0];
  if (caminho.includes('auth-callback')) {
    return;
  }

  const dadosAuth = extrairTokensDaUrl(url);

  if (!dadosAuth) {
    return;
  }

  const recuperacao = ehLinkDeRecuperacao(url, dadosAuth.type);

  // Marca antes de criar a sessão, para o _layout não redirecionar para (tabs)
  if (recuperacao) {
    iniciarRecuperacaoSenha();
  }

  let error: unknown = null;

  if ('code' in dadosAuth && dadosAuth.code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(dadosAuth.code));
  } else if ('accessToken' in dadosAuth && dadosAuth.accessToken && dadosAuth.refreshToken) {
    ({ error } = await supabase.auth.setSession({
      access_token: dadosAuth.accessToken,
      refresh_token: dadosAuth.refreshToken,
    }));
  } else {
    return;
  }

  if (error) {
    if (recuperacao) {
      finalizarRecuperacaoSenha();
    }
    return;
  }

  if (recuperacao) {
    router.replace('/(auth)/redefinir_senha');
  } else {
    router.replace('/(tabs)');
  }
}

export function useAuthDeepLink() {
  useEffect(() => {
    // App aberto a partir do link (app fechado/background)
    Linking.getInitialURL().then(tratarUrl);

    // App já aberto em primeiro plano
    const subscription = Linking.addEventListener(
      'url',
      (evento) => {
        tratarUrl(evento.url);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
