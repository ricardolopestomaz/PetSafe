import { LeituraDTO, RegistrarLeituraPayload } from "@/@types/mapa";
import { supabase } from "@/lib/supabaseClient";

export type Leitura = LeituraDTO;
export type { LeituraDTO, RegistrarLeituraPayload };

// Mantido vazio só para não quebrar arquivos que ainda importem este nome
export const MOCK_LEITURAS: Leitura[] = [];

// Leituras SIMULADAS: ficam só na memória do app (somem ao recarregar a página)
let leiturasSimuladas: Leitura[] = [];

const CAMPOS_LEITURA =
  "id, medalha_id, latitude, longitude, endereco_aprox, mensagem, criado_em, " +
  "medalha:medalhas!inner(pet_id, pet:pets!inner(id, nome, especie, raca))";

// Converte a linha do banco (leitura -> medalha -> pet) para o formato usado nas telas
function converterLeitura(linha: any): Leitura {
  const medalha = Array.isArray(linha.medalha)
    ? linha.medalha[0]
    : linha.medalha;
  const pet = Array.isArray(medalha?.pet) ? medalha.pet[0] : medalha?.pet;

  return {
    id: linha.id,
    pet_id: medalha?.pet_id,
    latitude: linha.latitude,
    longitude: linha.longitude,
    endereco_aproximado: linha.endereco_aprox ?? undefined,
    observacao_leitura: linha.mensagem ?? undefined,
    criado_em: linha.criado_em,
    pet: pet
      ? { id: pet.id, nome: pet.nome, especie: pet.especie, raca: pet.raca }
      : undefined,
  } as Leitura;
}

function maisRecentesPrimeiro(lista: Leitura[]): Leitura[] {
  return [...lista].sort(
    (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime(),
  );
}

// LISTAR TODAS AS LEITURAS (de todos os pets do tutor logado)
export async function listarTodasLeituras(): Promise<Leitura[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("leituras")
    .select(CAMPOS_LEITURA)
    .order("criado_em", { ascending: false });

  if (error) console.warn("[listarTodasLeituras]", error.message);

  const reais = error ? [] : (data ?? []).map(converterLeitura);
  return maisRecentesPrimeiro([...leiturasSimuladas, ...reais]);
}

// LISTAR LEITURAS DE UM PET ESPECÍFICO
export async function listarLeiturasPorPet(petId: string): Promise<Leitura[]> {
  const { data, error } = await supabase
    .from("leituras")
    .select(CAMPOS_LEITURA)
    .eq("medalha.pet_id", petId)
    .order("criado_em", { ascending: false });

  if (error) console.warn("[listarLeiturasPorPet]", error.message);

  const reais = error ? [] : (data ?? []).map(converterLeitura);
  const simuladas = leiturasSimuladas.filter((l) => l.pet_id === petId);
  return maisRecentesPrimeiro([...simuladas, ...reais]);
}

// SIMULAÇÃO DE UM NOVO ESCANEAMENTO (leitura falsa, só na memória)
export async function simularNovoEscaneamento(
  petId?: string,
): Promise<Leitura> {
  // Descobre o pet: o informado, ou o primeiro pet do tutor logado
  let consulta = supabase.from("pets").select("id, nome, especie, raca");
  consulta = petId
    ? consulta.eq("id", petId)
    : consulta.order("criado_em", { ascending: false });

  const { data: pets, error } = await consulta.limit(1);
  if (error) throw new Error(error.message);

  const pet = pets?.[0];
  if (!pet) {
    throw new Error("Cadastre um pet antes de simular um escaneamento.");
  }

  // Parte do ponto da última simulação deste pet (ou do centro de Palmas)
  const ultima = leiturasSimuladas.find((l) => l.pet_id === pet.id);
  const baseLat = ultima?.latitude ?? -10.1843;
  const baseLng = ultima?.longitude ?? -48.3336;
  const lat = baseLat + (Math.random() - 0.5) * 0.006;
  const lng = baseLng + (Math.random() - 0.5) * 0.006;

  const pontosLocais = [
    { bairro: "Plano Diretor Sul", endereco: "Próximo à Feira da 304 Sul" },
    { bairro: "Graciosa", endereco: "Avenida Parque Cesamar" },
    { bairro: "Plano Diretor Norte", endereco: "Alameda Central, 104 Norte" },
    { bairro: "Plano Diretor Sul", endereco: "Praça dos Girassóis" },
  ];
  const ponto = pontosLocais[Math.floor(Math.random() * pontosLocais.length)];
  const tipo = Math.random() > 0.5 ? "nfc" : "qrcode";

  const nova = {
    id: `scan-sim-${Date.now()}`,
    pet_id: pet.id,
    latitude: lat,
    longitude: lng,
    cidade: "Palmas",
    bairro: ponto.bairro,
    endereco_aproximado: `${ponto.endereco} (simulação)`,
    criado_em: new Date().toISOString(),
    lido_por_dispositivo: "Smartphone (simulação)",
    tipo_leitura: tipo,
    observacao_leitura: "Escaneamento simulado para teste.",
    pet: { id: pet.id, nome: pet.nome, especie: pet.especie, raca: pet.raca },
  } as Leitura;

  leiturasSimuladas.unshift(nova);
  return nova;
}

// Apaga todas as leituras simuladas
export function limparSimulacoes() {
  leiturasSimuladas = [];
}

// REGISTRAR UMA NOVA LEITURA REAL (quando alguém escaneia a medalha)
export async function registrarLeitura(params: {
  pet_id: string;
  latitude: number;
  longitude: number;
  endereco_aproximado?: string;
  observacao_leitura?: string;
  [chave: string]: any;
}): Promise<Leitura | null> {
  try {
    // A leitura pertence à medalha do pet
    const { data: medalha, error: erroMedalha } = await supabase
      .from("medalhas")
      .select("id")
      .eq("pet_id", params.pet_id)
      .limit(1)
      .maybeSingle();

    if (erroMedalha || !medalha) {
      console.warn("[registrarLeitura] Pet sem medalha vinculada.");
      return null;
    }

    const { data, error } = await supabase
      .from("leituras")
      .insert({
        medalha_id: medalha.id,
        latitude: params.latitude,
        longitude: params.longitude,
        endereco_aprox: params.endereco_aproximado,
        mensagem: params.observacao_leitura,
      })
      .select()
      .single();

    if (error) {
      console.warn("[registrarLeitura] Erro ao salvar leitura:", error.message);
      return null;
    }

    return {
      id: data.id,
      pet_id: params.pet_id,
      latitude: data.latitude,
      longitude: data.longitude,
      endereco_aproximado: data.endereco_aprox ?? undefined,
      criado_em: data.criado_em,
    } as Leitura;
  } catch (error) {
    console.warn("[registrarLeitura] Falha na requisição:", error);
    return null;
  }
}
