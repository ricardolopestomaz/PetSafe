# 🔐 Especificação Técnica: Fluxo de Autenticação, Cadastro e Login Google

> **Documento:** DTOs, Payloads e Arquitetura do Fluxo de Login/Cadastro  
> **Branch de Trabalho:** `feature/tela-login`  
> **Projeto:** PetSafe (Expo SDK 57 + Supabase)  
> **Status:** Pronto para Implementação

---

## 1. Visão Geral e Requisitos

Este documento orienta a reformulação completa do fluxo de autenticação do PetSafe na branch **`feature/tela-login`**, atendendo aos seguintes objetivos:
1. **Cadastro de Usuário:** Criação da conta no Supabase Auth com persistência do perfil na tabela `public.usuarios` (`id`, `nome`, `email`, `telefone`).
2. **Login com E-mail e Senha:** Validação e autenticação de sessão persistente no `AsyncStorage`.
3. **Login com Google (OAuth):** Integração via `expo-web-browser` com retorno seguro pelo esquema de deep link `petsafefront://`.
4. **Redirecionamento para a Home:** Transição imediata para `/(tabs)`, exibindo a saudação `"Olá, {primeiroNome}!"` formatada com o primeiro nome real do usuário autenticado (substituindo o mock fixo).
5. **Carregamento de Dados:** Sincronização dos pets e informações do tutor na tela inicial assim que o login for concluído.

---

## 2. DTOs (Data Transfer Objects) em TypeScript

Crie ou atualize o arquivo em `src/@types/auth.ts`:

```typescript
// ========================================================
// 1. DTOs de Entrada (Requests)
// ========================================================

/** Dados para cadastro de um novo usuário */
export interface CadastroUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha?: string;
  telefone?: string;
}

/** Credenciais para login convencional */
export interface LoginEmailSenhaDTO {
  email: string;
  senha: string;
}

/** Configuração para disparo do Login Social Google */
export interface LoginGoogleRequestDTO {
  redirectTo: string; // Ex: 'petsafefront://auth-callback'
}

// ========================================================
// 2. DTOs de Saída e Perfil (Responses)
// ========================================================

/** Perfil consolidado do usuário no PetSafe */
export interface PerfilUsuarioDTO {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  fotoPerfilUrl?: string;
  criadoEm?: string;
}

/** Resposta padrão das operações no Controller */
export interface AuthResultDTO {
  sucesso: boolean;
  mensagem?: string;
  usuario?: PerfilUsuarioDTO;
  possuiSessao?: boolean;
}

/** Estrutura da Sessão Supabase retornada pelo Auth */
export interface SessionDataDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    userMetadata: {
      nome?: string;
      full_name?: string;
      avatar_url?: string;
      picture?: string;
    };
  };
}
```

---

## 3. Payloads JSON Detalhados

### 3.1. Cadastro de Usuário (Sign Up)

#### Payload Enviado pelo App (Request):
```json
{
  "nome": "Ricardo Lopes",
  "email": "ricardo@exemplo.com",
  "senha": "SenhaSegura@123"
}
```

#### Payload de Envio ao Supabase (`supabase.auth.signUp`):
```json
{
  "email": "ricardo@exemplo.com",
  "password": "SenhaSegura@123",
  "options": {
    "data": {
      "nome": "Ricardo Lopes"
    }
  }
}
```

#### Resposta do Supabase Auth (Response):
```json
{
  "user": {
    "id": "e84d4fa7-8547-49f3-8b7c-87d97b0a72ef",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "ricardo@exemplo.com",
    "phone": "",
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {
      "nome": "Ricardo Lopes"
    },
    "created_at": "2026-10-15T14:30:00.000Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "vR-o9x_Kz5...",
    "expires_in": 3600,
    "token_type": "bearer"
  }
}
```

---

### 3.2. Login com E-mail e Senha (Sign In)

#### Payload Enviado (Request):
```json
{
  "email": "ricardo@exemplo.com",
  "senha": "SenhaSegura@123"
}
```

#### Resposta Sucesso (Response):
```json
{
  "sucesso": true,
  "usuario": {
    "id": "e84d4fa7-8547-49f3-8b7c-87d97b0a72ef",
    "nome": "Ricardo Lopes",
    "email": "ricardo@exemplo.com",
    "fotoPerfilUrl": null
  }
}
```

---

### 3.3. Login com Google (OAuth)

#### Passo 1: Inicialização do OAuth no Supabase
O app invoca:
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'petsafefront://auth-callback',
    skipBrowserRedirect: true,
  },
});
```

#### Resposta contendo a URL de autenticação:
```json
{
  "provider": "google",
  "url": "https://<supabase-id>.supabase.co/auth/v1/authorize?provider=google&redirect_to=petsafefront%3A%2F%2Fauth-callback"
}
```

#### Passo 2: Execução no `expo-web-browser`
O app abre a sessão de navegador com:
```typescript
const resultado = await WebBrowser.openAuthSessionAsync(data.url, 'petsafefront://');
```

#### Passo 3: Retorno via Deep Link (Callback Payload):
O Google redireciona para a URL do Supabase, que retorna para o app:
```
petsafefront://auth-callback#access_token=eyJhbGciOiJIUz...&refresh_token=eZ7a91...&expires_in=3600&token_type=bearer&type=recovery
```

#### Passo 4: Dados do Usuário Google após `setSession`:
```json
{
  "user": {
    "id": "b3e94511-7362-4ef1-9877-50d4f210d7a1",
    "email": "ricardo.google@gmail.com",
    "user_metadata": {
      "full_name": "Ricardo Lopes Tomaz",
      "name": "Ricardo Lopes Tomaz",
      "avatar_url": "https://lh3.googleusercontent.com/a/ACg8oc...",
      "email_verified": true
    }
  }
}
```

---

## 4. Como Sincronizar o Perfil com a Tabela `public.usuarios`

Na tabela `public.usuarios` ([database/PetSafe.sql](file:///c:/Users/srric/Documents/PetSafe/database/PetSafe.sql#L4-L14)):
```sql
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  email text UNIQUE,
  telefone text,
  endereco text,
  foto_perfil_url text,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

### Trigger Automático no PostgreSQL (Recomendado):
Execute este script no SQL Editor do seu Supabase para garantir que todo usuário criado (seja via E-mail ou via Google) seja automaticamente inserido na tabela `public.usuarios`:

```sql
-- Função para sincronizar auth.users -> public.usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, foto_perfil_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', 'Usuário'),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    foto_perfil_url = COALESCE(EXCLUDED.foto_perfil_url, public.usuarios.foto_perfil_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparada após criação de usuário no Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 5. Implementação Prática Passo a Passo

### 5.1. Atualizar o `src/model/authModel.ts`

Adicionar suporte ao Google OAuth e à recuperação do usuário ativo:

```typescript
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

// Login com Google
export async function loginComGoogle() {
  const redirectUrl = Linking.createURL('auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return { sucesso: false, mensagem: error?.message || 'Erro ao iniciar login Google.' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type === 'success' && result.url) {
    const params = new URLSearchParams(result.url.split('#')[1]);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        return { sucesso: false, mensagem: sessionError.message };
      }

      return { sucesso: true };
    }
  }

  return { sucesso: false, mensagem: 'Login com Google cancelado ou não concluído.' };
}

// Obter dados do usuário atual autenticado
export async function obterUsuarioAtual() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Tenta buscar da tabela usuarios
  const { data: perfil } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single();

  const nome = perfil?.nome || user.user_metadata?.nome || user.user_metadata?.full_name || 'Usuário';

  return {
    id: user.id,
    email: user.email || '',
    nome,
    fotoPerfilUrl: perfil?.foto_perfil_url || user.user_metadata?.avatar_url,
  };
}
```

---

### 5.2. Atualizar o Controller (`src/controller/authController.ts`)

```typescript
export async function realizarLoginGoogle() {
  return await AuthModel.loginComGoogle();
}

export async function carregarDadosUsuarioLogado() {
  return await AuthModel.obterUsuarioAtual();
}
```

---

### 5.3. Atualizar a Tela de Login (`src/app/(auth)/login.tsx`)

Adicionar o botão **"Entrar com o Google"** com visual limpo e moderno:

```tsx
{/* Divisor "OU" */}
<View style={style.divisorContainer}>
  <View style={style.linhaDivisora} />
  <Text style={style.textoDivisor}>ou continue com</Text>
  <View style={style.linhaDivisora} />
</View>

{/* Botão Google */}
<Pressable
  style={style.googleButton}
  onPress={async () => {
    setCarregando(true);
    const res = await AuthController.realizarLoginGoogle();
    setCarregando(false);
    if (res.sucesso) {
      router.replace('/(tabs)');
    } else if (res.mensagem) {
      Alert.alert('Login Google', res.mensagem);
    }
  }}
  disabled={carregando}
>
  <Ionicons name="logo-google" size={20} color="#EA4335" />
  <Text style={style.googleButtonText}>Entrar com o Google</Text>
</Pressable>
```

---

### 5.4. Atualizar a Home (`src/app/(tabs)/index.tsx`)

Substituir o `useUser` mockado pelo carregamento real:

```tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const [nomeUsuario, setNomeUsuario] = useState("Usuário");

  useEffect(() => {
    async function carregarUsuario() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Busca da tabela usuarios ou do user_metadata
        const nome = user.user_metadata?.nome || user.user_metadata?.full_name || "Usuário";
        setNomeUsuario(nome);
      }
    }
    carregarUsuario();
  }, []);

  // Formatação: Pega o primeiro nome
  const primeiroNome = nomeUsuario ? nomeUsuario.trim().split(" ")[0] : "Usuário";

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <>
            {/* NOME FORMATADO DINAMICAMENTE */}
            <Text style={styles.titulo}>Olá, {primeiroNome}!</Text>
            {/* ... restante dos componentes da home */}
          </>
        }
      />
    </SafeAreaView>
  );
}
```

---

## 6. Checklist de Validação

- [x] Branch `feature/tela-login` criada e selecionada.
- [ ] Formulário de login valida campos vazios e formatação de e-mail.
- [ ] Botão do Google OAuth dispara o navegador com sucesso.
- [ ] Retorno do OAuth redireciona para `/(tabs)`.
- [ ] Tela Home renderiza `"Olá, {PrimeiroNome}!"` dinamicamente conforme a conta logada.
- [ ] Pets do tutor logado carregam corretamente pelo `listarMeusPets()`.
