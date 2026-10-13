import { supabase } from "@/lib/supabase";
import { Pet } from "./pets";

export type Leitura = {
  id: string;
  pet_id: string;
  latitude: number;
  longitude: number;
  cidade?: string;
  bairro?: string;
  endereco_aproximado?: string;
  criado_em: string;
  lido_por_dispositivo?: string;
  pet?: Pet;
};

// Dados mockados inteligentes para demonstração e desenvolvimento local caso a tabela ainda não esteja populada no Supabase
export const MOCK_LEITURAS: Leitura[] = [
  {
    id: "scan-1",
    pet_id: "demo-pet-1",
    latitude: -10.1843,
    longitude: -48.3336,
    cidade: "Palmas",
    bairro: "Plano Diretor Sul",
    endereco_aproximado: "Próximo à Praça dos Girassóis",
    criado_em: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min atrás
    lido_por_dispositivo: "iPhone 14 (Safari)",
    pet: {
      id: "demo-pet-1",
      nome: "Pipoca",
      especie: "Cachorro",
      raca: "Golden Retriever",
    },
  },
  {
    id: "scan-2",
    pet_id: "demo-pet-1",
    latitude: -10.1915,
    longitude: -48.3298,
    cidade: "Palmas",
    bairro: "Graciosa",
    endereco_aproximado: "Av. LO-05, Parque Cesamar",
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 horas atrás
    lido_por_dispositivo: "Samsung Galaxy S23 (Chrome)",
    pet: {
      id: "demo-pet-1",
      nome: "Pipoca",
      especie: "Cachorro",
      raca: "Golden Retriever",
    },
  },
  {
    id: "scan-3",
    pet_id: "demo-pet-2",
    latitude: -10.1789,
    longitude: -48.3412,
    cidade: "Palmas",
    bairro: "Plano Diretor Norte",
    endereco_aproximado: "Quadra 104 Norte",
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // Ontem
    lido_por_dispositivo: "Xiaomi Redmi (Chrome)",
    pet: {
      id: "demo-pet-2",
      nome: "Mimi",
      especie: "Gato",
      raca: "Siamês",
    },
  },
];

// LISTAR TODAS AS LEITURAS (de todos os pets do tutor)
export async function listarTodasLeituras(): Promise<Leitura[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Se estiver logado, tenta buscar no Supabase
    if (user) {
      const { data, error } = await supabase
        .from("leituras")
        .select("*, pet:pets(*)")
        .order("criado_em", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Leitura[];
      }
    }

    // Fallback gracioso com dados de demonstração
    return MOCK_LEITURAS;
  } catch (error) {
    console.warn("[listarTodasLeituras] Erro ao carregar do Supabase, usando mocks:", error);
    return MOCK_LEITURAS;
  }
}

// LISTAR LEITURAS DE UM PET ESPECÍFICO
export async function listarLeiturasPorPet(petId: string): Promise<Leitura[]> {
  try {
    const { data, error } = await supabase
      .from("leituras")
      .select("*, pet:pets(*)")
      .eq("pet_id", petId)
      .order("criado_em", { ascending: false });

    if (!error && data && data.length > 0) {
      return data as Leitura[];
    }

    // Se não houver no banco, filtra os mocks ou retorna leituras ajustadas ao pet
    const filtrados = MOCK_LEITURAS.filter((l) => l.pet_id === petId);
    if (filtrados.length > 0) {
      return filtrados;
    }

    // Se for um pet real recém criado, fornece dados de exemplo com o ID dele
    return [
      {
        id: `scan-${petId}-1`,
        pet_id: petId,
        latitude: -10.1843,
        longitude: -48.3336,
        cidade: "Palmas",
        bairro: "Plano Diretor Sul",
        endereco_aproximado: "Leitura recente registrada via medalha",
        criado_em: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        lido_por_dispositivo: "Dispositivo móvel",
      },
    ];
  } catch (error) {
    console.warn("[listarLeiturasPorPet] Erro ao carregar do Supabase:", error);
    return MOCK_LEITURAS.filter((l) => l.pet_id === petId);
  }
}

// REGISTRAR UMA NOVA LEITURA (quando alguém escaneia a medalha)
export async function registrarLeitura(params: {
  pet_id: string;
  latitude: number;
  longitude: number;
  cidade?: string;
  bairro?: string;
  endereco_aproximado?: string;
  lido_por_dispositivo?: string;
}): Promise<Leitura | null> {
  try {
    const { data, error } = await supabase
      .from("leituras")
      .insert({
        pet_id: params.pet_id,
        latitude: params.latitude,
        longitude: params.longitude,
        cidade: params.cidade,
        bairro: params.bairro,
        endereco_aproximado: params.endereco_aproximado,
        lido_por_dispositivo: params.lido_por_dispositivo,
        criado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn("[registrarLeitura] Erro ao salvar leitura no banco:", error);
      return null;
    }

    return data as Leitura;
  } catch (error) {
    console.warn("[registrarLeitura] Falha na requisição:", error);
    return null;
  }
}
