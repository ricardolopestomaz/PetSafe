export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatActionDTO {
  tipo: 'NAVIGATE' | 'OPEN_MODAL' | 'EXTERNAL_LINK';
  rotulo: string;
  rota?: string;
  params?: Record<string, any>;
}

export interface ChatMessageDTO {
  id: string;
  conversaId: string;
  papel: MessageRole;
  conteudo: string;
  acoes?: ChatActionDTO[];
  criadoEm: string;
}

export interface PetContextDTO {
  id: string;
  nome: string;
  especie?: string;
  raca?: string;
  idadeAnos?: number;
  dataNascimento?: string;
  pesoKg?: number;
  medalhaAtiva?: boolean;
  codigoMedalha?: string;
  vacinasPendentes?: string[];
  observacoes?: string;
}

export interface UserContextDTO {
  usuarioId: string;
  nome: string;
  plano?: string;
  totalPets: number;
  pets: PetContextDTO[];
}

export interface SendMessageRequestDTO {
  conversaId?: string;
  mensagem: string;
  petFocoId?: string;
  contexto?: {
    telaAtual?: string;
    versaoApp?: string;
  };
}

export interface SendMessageResponseDTO {
  conversaId: string;
  mensagem: ChatMessageDTO;
  sugestoesProximasPerguntas?: string[];
  status: 'sucesso' | 'erro';
  erro?: string;
}

export interface QuickPromptDTO {
  id: string;
  categoria: 'app' | 'pet' | 'emergencia';
  titulo: string;
  prompt: string;
  icone: string;
}
