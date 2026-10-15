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

export interface PerfilUsuarioDTO {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  fotoPerfilUrl?: string;
  criadoEm?: string;
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
