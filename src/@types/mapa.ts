import { PetDTO } from "./pet";

export type TipoLeituraTag = "nfc" | "qrcode";
export type TipoCamadaMapa = "padrao" | "satelite";

export interface LeituraDTO {
  id: string;
  pet_id: string;
  latitude: number;
  longitude: number;
  cidade?: string;
  bairro?: string;
  endereco_aproximado?: string;
  criado_em: string;
  lido_por_dispositivo?: string;
  tipo_leitura?: TipoLeituraTag;
  observacao_leitura?: string;
  pet?: PetDTO;
}

export interface RegistrarLeituraPayload {
  pet_id: string;
  latitude: number;
  longitude: number;
  cidade?: string;
  bairro?: string;
  endereco_aproximado?: string;
  lido_por_dispositivo?: string;
  tipo_leitura?: TipoLeituraTag;
  observacao_leitura?: string;
}

export interface SimularEscaneamentoPayload {
  petId: string;
  bairro?: string;
  endereco?: string;
}

export interface MapaFiltroPayload {
  petId?: string | null;
  especie?: string;
  limite?: number;
}

export interface MapaCoordenadaPayload {
  latitude: number;
  longitude: number;
}

export type MapaComandoTipo =
  | "SELECT_SCAN"
  | "MARKER_CLICKED"
  | "FIT_ALL"
  | "CENTER_LATEST"
  | "SET_LAYER"
  | "USER_LOCATION"
  | "MAP_READY";

export interface MapaComandoPayload {
  type: MapaComandoTipo;
  id?: string;
  lat?: number;
  lng?: number;
  layer?: TipoCamadaMapa;
}
