export type EspeciePet = "Cachorro" | "Gato" | "Outro" | string;

export type StatusAlertaPet = "seguro" | "perdido";

export interface ContatoEmergenciaDTO {
  id: string;
  nome: string;
  relacao: string;
  telefone: string;
  whatsapp?: string;
  email?: string;
  prioridade: number;
  observacao?: string;
}

export interface FichaMedicaPetDTO {
  castrado?: boolean;
  peso_kg?: number;
  tipo_sanguineo?: string;
  vacinas_em_dia?: boolean;
  ultima_vacina?: string;
  alergias?: string[];
  medicacoes?: string[];
  restricoes_alimentares?: string;
  veterinario_nome?: string;
  veterinario_telefone?: string;
  cuidados_especiais?: string;
}

export interface TagMedalhaDTO {
  codigo: string;
  ativa: boolean;
  tipo?: "qrcode_nfc" | "qrcode" | "nfc";
  status_alerta?: StatusAlertaPet;
  mensagem_alerta?: string;
  recompensa?: string;
}

export interface TutorPublicoDTO {
  id?: string;
  nome: string;
  telefone: string;
  whatsapp?: string;
  email?: string;
  cidade?: string;
  bairro?: string;
  endereco_aproximado?: string;
  mostrar_endereco?: boolean;
}

export interface PetDTO {
  id: string;
  tutor_id?: string;
  nome: string;
  especie?: EspeciePet;
  raca?: string;
  data_nascimento?: string;
  idade?: string;
  porte?: "Pequeno" | "Médio" | "Grande" | string;
  sexo?: "Macho" | "Fêmea" | string;
  cor?: string;
  comportamento?: string;
  cidade?: string;
  bairro?: string;
  foto_url?: string;
  video_url?: string;
  observacoes?: string;
  tag?: TagMedalhaDTO;
  tutor?: TutorPublicoDTO;
  contatos_emergencia?: ContatoEmergenciaDTO[];
  ficha_medica?: FichaMedicaPetDTO;
  criado_em?: string;
  atualizado_em?: string;
}

export interface CriarPetPayload {
  nome: string;
  especie: EspeciePet;
  raca?: string;
  data_nascimento?: string;
  foto_url?: string;
  observacoes?: string;
}

export interface AtualizarPetPayload {
  nome?: string;
  especie?: EspeciePet;
  raca?: string;
  data_nascimento?: string;
  foto_url?: string;
  observacoes?: string;
}

export interface PetResponseDTO {
  sucesso: boolean;
  mensagem?: string;
  pet?: PetDTO;
}

export interface ListarPetsResponseDTO {
  sucesso: boolean;
  dados: PetDTO[];
  total: number;
}
