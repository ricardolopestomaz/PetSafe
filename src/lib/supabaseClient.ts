import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

let envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let envKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const isValidUrl = Boolean(
  envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))
);

if (!isValidUrl || !envKey) {
  console.warn(
    '[Supabase] Variáveis do Supabase não configuradas ou URL inválida. O aplicativo está rodando em modo de teste sem conexão real.'
  );
  envUrl = 'https://placeholder.supabase.co';
  envKey = 'placeholder-key';
} else if (envKey.startsWith('sb_secret_')) {
  console.error(
    '[Supabase] ATENÇÃO: A chave configurada no .env é a chave SECRETA (sb_secret_...). O navegador bloqueia o uso de chaves secretas ("Forbidden use of secret API key in browser"). Use a chave "anon" / "publishable" no .env.'
  );
}

export const supabase = createClient(
  envUrl!,
  envKey!,
  {
    auth: {
      storage:
        Platform.OS === 'web'
          ? undefined
          : AsyncStorage,

      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);