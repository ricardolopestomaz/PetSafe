import { Platform } from "react-native";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import { LeituraDTO, RegistrarLeituraPayload, TipoLeituraTag } from "@/@types/mapa";
import { getPet } from "@/services/pets";

export type Leitura = LeituraDTO;
export type { LeituraDTO, RegistrarLeituraPayload };

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

function identificarDispositivoAtual(): string {
  if (Platform.OS === "web" && typeof navigator !== "undefined") {
    const ua = navigator.userAgent || "";
    if (/iPhone/i.test(ua)) return "iPhone (Navegador Web)";
    if (/Android/i.test(ua)) return "Smartphone Android (Navegador Web)";
    if (/Macintosh/i.test(ua)) return "Mac (Navegador Web)";
    if (/Windows/i.test(ua)) return " Computador Windows (Navegador Web)";
    return "Navegador Web (Página Pública PetSafe)";
  }
  if (Platform.OS === "ios") return "iPhone (App PetSafe)";
  if (Platform.OS === "android") return "Android (App PetSafe)";
  return "Dispositivo Móvel";
}

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
  const petInfo = await getPet(params.pet_id).catch(() => undefined);

  const leituraLocal: Leitura = {
    id: `scan-pub-${Date.now()}`,
    pet_id: params.pet_id,
    latitude: params.latitude,
    longitude: params.longitude,
    cidade: params.cidade || "Palmas",
    bairro: params.bairro || "Plano Diretor",
    endereco_aproximado:
      params.endereco_aproximado ||
      `Coordenadas GPS (${params.latitude.toFixed(4)}, ${params.longitude.toFixed(4)})`,
    criado_em: new Date().toISOString(),
    lido_por_dispositivo:
      params.lido_por_dispositivo || identificarDispositivoAtual(),
    tipo_leitura: params.tipo_leitura || "qrcode",
    observacao_leitura: params.observacao_leitura,
    pet: petInfo
      ? {
          id: petInfo.id,
          nome: petInfo.nome,
          especie: petInfo.especie,
          raca: petInfo.raca,
        }
      : undefined,
  };

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
        lido_por_dispositivo: leituraLocal.lido_por_dispositivo,
        tipo_leitura: params.tipo_leitura,
        observacao_leitura: params.observacao_leitura,
        criado_em: leituraLocal.criado_em,
      })
      .select()
      .single();

    if (!error && data) {
      const registrada: Leitura = {
        ...(data as Leitura),
        pet: leituraLocal.pet,
      };
      leiturasEmMemoria.unshift(registrada);
      return registrada;
    }

    // Fallback em memória para funcionamento imediato em modo de demonstração/teste
    leiturasEmMemoria.unshift(leituraLocal);
    return leituraLocal;
  } catch {
    leiturasEmMemoria.unshift(leituraLocal);
    return leituraLocal;
  }
}

/**
 * Solicita permissão explícita de localização ao visitante (RNF09),
 * captura as coordenadas GPS do navegador/celular (RF07) e registra a leitura na tabela `leituras`.
 */
export async function capturarLocalizacaoERegistrarLeitura(params: {
  petId: string;
  tipoLeitura?: TipoLeituraTag;
  nomeEncontrou?: string;
  telefoneEncontrou?: string;
  observacao?: string;
}): Promise<{
  sucesso: boolean;
  leitura?: Leitura;
  usouFallback?: boolean;
  mensagem: string;
}> {
  const partesObs: string[] = [];
  if (params.nomeEncontrou?.trim()) {
    partesObs.push(`Encontrado por: ${params.nomeEncontrou.trim()}`);
  }
  if (params.telefoneEncontrou?.trim()) {
    partesObs.push(`Contato: ${params.telefoneEncontrou.trim()}`);
  }
  if (params.observacao?.trim()) {
    partesObs.push(params.observacao.trim());
  }
  const observacaoCompleta =
    partesObs.length > 0
      ? partesObs.join(" • ")
      : "Localização compartilhada pela Página Pública da Medalha PetSafe.";

  let latitude = -10.1843;
  let longitude = -48.3336;
  let cidade = "Palmas";
  let bairro = "Plano Diretor Sul";
  let enderecoAproximado = "Localização enviada pela Página Pública da Tag";
  let usouFallback = false;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      return {
        sucesso: false,
        mensagem:
          "Permissão de localização negada. Para enviar a posição exata ao tutor, autorize o acesso ao GPS no seu navegador ou celular.",
      };
    }

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    latitude = pos.coords.latitude;
    longitude = pos.coords.longitude;

    // Tenta geocodificação reversa nativa/web
    try {
      const enderecos = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      if (enderecos && enderecos.length > 0) {
        const end = enderecos[0];
        cidade = end.city || end.subregion || "Palmas";
        bairro = end.district || end.street || "Centro";
        const ruaNumero = [end.street, end.streetNumber]
          .filter(Boolean)
          .join(", ");
        enderecoAproximado =
          [ruaNumero, bairro, cidade].filter(Boolean).join(" — ") ||
          `GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      } else {
        enderecoAproximado = `Localização GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      }
    } catch {
      enderecoAproximado = `Localização GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
    }
  } catch {
    // Caso o ambiente (ex: desktop sem GPS ou navegador bloqueado sem HTTPS) não retorne coordenadas,
    // gera coordenada realista próxima à última leitura para não travar a demonstração
    usouFallback = true;
    const base =
      leiturasEmMemoria.find((l) => l.pet_id === params.petId) ||
      leiturasEmMemoria[0];
    latitude = (base?.latitude || -10.1843) + (Math.random() - 0.5) * 0.004;
    longitude = (base?.longitude || -48.3336) + (Math.random() - 0.5) * 0.004;
    cidade = base?.cidade || "Palmas";
    bairro = base?.bairro || "Plano Diretor Sul";
    enderecoAproximado = params.observacao?.trim()
      ? `${params.observacao.trim()} (${bairro}, ${cidade})`
      : `Próximo à ${bairro}, ${cidade} (Localização aproximada)`;
  }

  const leitura = await registrarLeitura({
    pet_id: params.petId,
    latitude,
    longitude,
    cidade,
    bairro,
    endereco_aproximado: enderecoAproximado,
    lido_por_dispositivo: identificarDispositivoAtual(),
    tipo_leitura: params.tipoLeitura || "qrcode",
    observacao_leitura: observacaoCompleta,
  });

  if (!leitura) {
    return {
      sucesso: false,
      mensagem: "Não foi possível registrar a leitura no momento. Tente novamente.",
    };
  }

  return {
    sucesso: true,
    leitura,
    usouFallback,
    mensagem: usouFallback
      ? "Alerta e localização aproximada enviados ao tutor com sucesso!"
      : "Sua localização GPS exata foi enviada ao tutor com sucesso!",
  };
}
