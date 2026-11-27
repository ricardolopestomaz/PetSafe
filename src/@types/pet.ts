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
  video_url?: string;
  observacoes?: string;
}

// Únicos campos que o tutor pode alterar num pet (id, tutor_id e criado_em ficam de fora).
// null = limpar o campo no banco.
export interface AtualizarPetPayload {
  nome?: string;
  especie?: EspeciePet;
  raca?: string | null;
  data_nascimento?: string | null;
  foto_url?: string | null;
  video_url?: string | null;
  observacoes?: string | null;
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
