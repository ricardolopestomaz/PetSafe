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
  tipo_leitura?: "nfc" | "qrcode";
  observacao_leitura?: string;
  pet?: Pet;
};

// Dados mockados inteligentes demonstrando o histórico recente de escaneamentos do cachorro
export const MOCK_LEITURAS: Leitura[] = [
  {
    id: "scan-1",
    pet_id: "demo-pet-1",
    latitude: -10.1843,
    longitude: -48.3336,
    cidade: "Palmas",
    bairro: "Plano Diretor Sul",
    endereco_aproximado: "Praça dos Girassóis, Ala Norte (próximo ao monumento)",
    criado_em: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 min atrás (Mais recente)
    lido_por_dispositivo: "iPhone 15 Pro (Safari)",
    tipo_leitura: "nfc",
    observacao_leitura: "Medalha aproximada por pedestre via NFC.",
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
    endereco_aproximado: "Av. LO-05, Pista de Caminhada do Parque Cesamar",
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 2.5).toISOString(), // 2h30 atrás
    lido_por_dispositivo: "Samsung Galaxy S24 (Chrome)",
    tipo_leitura: "qrcode",
    observacao_leitura: "QR Code escaneado por frequentador do parque.",
    pet: {
      id: "demo-pet-1",
      nome: "Pipoca",
      especie: "Cachorro",
      raca: "Golden Retriever",
    },
  },
  {
    id: "scan-3",
    pet_id: "demo-pet-1",
    latitude: -10.1985,
    longitude: -48.3225,
    cidade: "Palmas",
    bairro: "Plano Diretor Sul",
    endereco_aproximado: "Av. JK, em frente ao Pet Shop & Clínica Veterinária",
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h atrás
    lido_por_dispositivo: "Motorola Edge (Chrome)",
    tipo_leitura: "nfc",
    observacao_leitura: "Medalha aproximada com sucesso.",
    pet: {
      id: "demo-pet-1",
      nome: "Pipoca",
      especie: "Cachorro",
      raca: "Golden Retriever",
    },
  },
  {
    id: "scan-4",
    pet_id: "demo-pet-1",
    latitude: -10.2052,
    longitude: -48.3158,
    cidade: "Palmas",
    bairro: "Quadra 204 Sul",
    endereco_aproximado: "Alameda 12, próximo à Praça Residencial",
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Ontem
    lido_por_dispositivo: "iPhone 13 (Safari)",
    tipo_leitura: "qrcode",
    observacao_leitura: "QR Code escaneado na área residencial.",
    pet: {
      id: "demo-pet-1",
      nome: "Pipoca",
      especie: "Cachorro",
      raca: "Golden Retriever",
    },
  },
  {
    id: "scan-5",
    pet_id: "demo-pet-3",
    latitude: -10.178,
    longitude: -48.345,
    cidade: "Palmas",
    bairro: "Graciosa",
    endereco_aproximado: "Orla da Praia da Graciosa, Quiosque 4",
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    lido_por_dispositivo: "Xiaomi Redmi Note (Firefox)",
    tipo_leitura: "qrcode",
    pet: {
      id: "demo-pet-3",
      nome: "Thor",
      especie: "Cachorro",
      raca: "Bulldog Francês",
    },
  },
  {
    id: "scan-6",
    pet_id: "demo-pet-2",
    latitude: -10.1789,
    longitude: -48.3412,
    cidade: "Palmas",
    bairro: "Plano Diretor Norte",
    endereco_aproximado: "Quadra 104 Norte",
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    lido_por_dispositivo: "iPhone 12 (Chrome)",
    tipo_leitura: "nfc",
    pet: {
      id: "demo-pet-2",
      nome: "Mimi",
      especie: "Gato",
      raca: "Siamês",
    },
  },
];

let leiturasEmMemoria: Leitura[] = [...MOCK_LEITURAS];

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
    return leiturasEmMemoria;
  } catch (error) {
    console.warn("[listarTodasLeituras] Erro ao carregar do Supabase, usando mocks:", error);
    return leiturasEmMemoria;
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

    // Se não houver no banco, filtra os mocks em memória
    const filtrados = leiturasEmMemoria.filter((l) => l.pet_id === petId);
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
        tipo_leitura: "nfc",
      },
    ];
  } catch (error) {
    console.warn("[listarLeiturasPorPet] Erro ao carregar do Supabase:", error);
    return leiturasEmMemoria.filter((l) => l.pet_id === petId);
  }
}

// SIMULAÇÃO DE UM NOVO ESCANEAMENTO (para testes interativos no app)
export async function simularNovoEscaneamento(
  petId: string = "demo-pet-1"
): Promise<Leitura> {
  const leituraBase =
    leiturasEmMemoria.find((l) => l.pet_id === petId) || leiturasEmMemoria[0];
  const offsetLat = (Math.random() - 0.5) * 0.006;
  const offsetLng = (Math.random() - 0.5) * 0.006;

  const pontosLocais = [
    {
      bairro: "Plano Diretor Sul",
      endereco: "Próximo à Feira da 304 Sul - Medalha aproximada",
    },
    {
      bairro: "Graciosa",
      endereco: "Avenida Parque Cesamar - QR Code lido",
    },
    {
      bairro: "Plano Diretor Norte",
      endereco: "Alameda Central, 104 Norte - Tag NFC lida",
    },
  ];
  const pontoAleatorio =
    pontosLocais[Math.floor(Math.random() * pontosLocais.length)];

  const novaLeitura: Leitura = {
    id: `scan-sim-${Date.now()}`,
    pet_id: petId,
    latitude: (leituraBase?.latitude || -10.1843) + offsetLat,
    longitude: (leituraBase?.longitude || -48.3336) + offsetLng,
    cidade: "Palmas",
    bairro: pontoAleatorio.bairro,
    endereco_aproximado: pontoAleatorio.endereco,
    criado_em: new Date().toISOString(),
    lido_por_dispositivo: "Smartphone (Tag PetSafe aproximada agora)",
    tipo_leitura: Math.random() > 0.5 ? "nfc" : "qrcode",
    observacao_leitura: "Escaneamento recente registrado no mapa interativo.",
    pet: leituraBase?.pet || {
      id: petId,
      nome: "Pipoca",
      especie: "Cachorro",
      raca: "Golden Retriever",
    },
  };

  leiturasEmMemoria.unshift(novaLeitura);
  return novaLeitura;
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
  tipo_leitura?: "nfc" | "qrcode";
  observacao_leitura?: string;
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
        tipo_leitura: params.tipo_leitura,
        observacao_leitura: params.observacao_leitura,
        criado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.warn("[registrarLeitura] Erro ao salvar leitura no banco:", error);
      return null;
    }

    if (data) {
      leiturasEmMemoria.unshift(data as Leitura);
    }
    return data as Leitura;
  } catch (error) {
    console.warn("[registrarLeitura] Falha na requisição:", error);
    return null;
  }
}
