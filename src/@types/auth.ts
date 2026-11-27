export interface CadastroUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha?: string;
  telefone?: string;
}

export interface LoginEmailSenhaDTO {
  email: string;
  senha: string;
}

export interface LoginGoogleRequestDTO {
  redirectTo: string;
}

// Preferências de comunicação do tutor.
// Ficam em auth.users.user_metadata.preferencias (não há coluna/tabela para isso no banco).
export interface PreferenciasTutorDTO {
  alertaEscaneamentoPush: boolean;
  alertaEscaneamentoEmail: boolean;
  novidadesPetSafe: boolean;
}

export const PREFERENCIAS_PADRAO: PreferenciasTutorDTO = {
  alertaEscaneamentoPush: true,
  alertaEscaneamentoEmail: true,
  novidadesPetSafe: false,
};

export type ProvedorLogin = "email" | "google" | string;

export interface PerfilUsuarioDTO {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  fotoPerfilUrl?: string;
  criadoEm?: string;
  // Informações da conta (vindas do Supabase Auth)
  ultimoAcessoEm?: string;
  emailConfirmado?: boolean;
  emailPendente?: string; // novo e-mail aguardando confirmação
  provedores?: ProvedorLogin[];
  possuiSenha?: boolean; // false = conta criada só com Google
  preferencias?: PreferenciasTutorDTO;
}

// Campos que o próprio tutor pode alterar na tabela public.usuarios
export interface AtualizarPerfilPayload {
  nome: string;
  telefone: string | null;
  fotoPerfilUrl: string | null;
}

export interface AuthResultDTO {
  sucesso: boolean;
  mensagem?: string;
  usuario?: PerfilUsuarioDTO;
  possuiSessao?: boolean;
}

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
