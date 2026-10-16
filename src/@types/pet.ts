export type EspeciePet = "Cachorro" | "Gato" | "Outro" | string;

export interface PetDTO {
  id: string;
  tutor_id?: string;
  nome: string;
  especie?: EspeciePet;
  raca?: string;
  data_nascimento?: string;
  foto_url?: string;
  video_url?: string;
  observacoes?: string;
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
