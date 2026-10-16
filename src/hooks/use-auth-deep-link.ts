import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useEffect } from 'react';

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
  const type = params.get('type');

  if (!accessToken || !refreshToken) {
    return null;
  }

  return { accessToken, refreshToken, type };
}

async function tratarUrl(url: string | null) {
  if (!url) {
    return;
  }

  const tokens = extrairTokensDaUrl(url);

  if (!tokens) {
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });

  if (error) {
    return;
  }

  if (tokens.type === 'recovery') {
    router.replace('/(auth)/recuperar_senha');
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