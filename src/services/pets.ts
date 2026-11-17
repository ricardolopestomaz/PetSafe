import { supabase } from "@/lib/supabase";
import {
  ContatoEmergenciaDTO,
  CriarPetPayload,
  FichaMedicaPetDTO,
  PetDTO,
  StatusAlertaPet,
  TagMedalhaDTO,
  TutorPublicoDTO,
} from "@/@types/pet";

export type Pet = PetDTO;
export type {
  ContatoEmergenciaDTO,
  CriarPetPayload,
  FichaMedicaPetDTO,
  PetDTO,
  StatusAlertaPet,
  TagMedalhaDTO,
  TutorPublicoDTO,
};

export const MOCK_PETS: Pet[] = [
  {
    id: "demo-pet-1",
    nome: "Pipoca",
    especie: "Cachorro",
    raca: "Golden Retriever",
    data_nascimento: "2023-04-12",
    idade: "3 anos",
    porte: "Grande",
    sexo: "Macho",
    cor: "Dourado",
    comportamento:
      "Extremamente dócil, amigável com crianças e outros animais. Atende pelo nome.",
    cidade: "Palmas - TO",
    bairro: "Plano Diretor Sul (204 Sul)",
    observacoes:
      "Usa coleira azul marinho com medalha PetSafe. Visto por último próximo ao Parque Cesamar.",
    tag: {
      codigo: "PS-2026-0101",
      ativa: true,
      tipo: "qrcode_nfc",
      status_alerta: "perdido",
      mensagem_alerta:
        "Desapareceu próximo ao Parque Cesamar! Ele é muito manso. Se você o encontrou, chame no WhatsApp ou envie sua localização.",
      recompensa: "Gratifica-se pelo reencontro",
    },
    tutor: {
      nome: "Igor Anicezio Oliveira",
      telefone: "(63) 99245-8810",
      whatsapp: "5563992458810",
      email: "contato.tutor@petsafe.com.br",
      cidade: "Palmas - TO",
      bairro: "Quadra 204 Sul",
      endereco_aproximado: "Quadra 204 Sul, Alameda 12, Palmas - TO",
      mostrar_endereco: true,
    },
    contatos_emergencia: [
      {
        id: "cont-1",
        nome: "Igor Anicezio",
        relacao: "Tutor Principal",
        telefone: "(63) 99245-8810",
        whatsapp: "5563992458810",
        email: "contato.tutor@petsafe.com.br",
        prioridade: 1,
        observacao: "Atende ligações e WhatsApp a qualquer hora.",
      },
      {
        id: "cont-2",
        nome: "Anna Beatriz",
        relacao: "Co-tutora / Família",
        telefone: "(63) 99112-3409",
        whatsapp: "5563991123409",
        prioridade: 2,
        observacao: "Acionar caso o tutor principal não atenda.",
      },
      {
        id: "cont-3",
        nome: "Clínica VetVida 24h",
        relacao: "Veterinário de Confiança",
        telefone: "(63) 3215-4090",
        whatsapp: "556332154090",
        prioridade: 3,
        observacao: "Prontuário nº 4892 — atendimento autorizado.",
      },
    ],
    ficha_medica: {
      castrado: true,
      peso_kg: 29.5,
      tipo_sanguineo: "DEA 1.1 Positivo",
      vacinas_em_dia: true,
      ultima_vacina: "V10 + Antirrábica (Agosto/2026)",
      alergias: ["Alergia a picada de pulga (DAPP)", "Corantes artificiais"],
      medicacoes: ["Antipulgas Simparic mensal (dia 10)"],
      restricoes_alimentares: "Não oferecer alimentos com tempero, ossos cozidos ou chocolate.",
      veterinario_nome: "Dra. Camila Mendes (CRMV-TO 1420)",
      veterinario_telefone: "(63) 3215-4090",
      cuidados_especiais: "Manter na sombra com água fresca devido ao calor de Palmas.",
    },
  },
  {
    id: "demo-pet-2",
    nome: "Mimi",
    especie: "Gato",
    raca: "Siamês",
    data_nascimento: "2024-07-20",
    idade: "2 anos",
    porte: "Pequeno",
    sexo: "Fêmea",
    cor: "Creme / Pontas escuras",
    comportamento:
      "Dócil, porém assustada com barulhos altos. Aproxime-se devagar.",
    cidade: "Palmas - TO",
    bairro: "Quadra 104 Norte",
    observacoes: "Saiu de casa na região da 104 Norte. Usa coleira vermelha com tag QR Code.",
    tag: {
      codigo: "PS-2026-0202",
      ativa: true,
      tipo: "qrcode_nfc",
      status_alerta: "perdido",
      mensagem_alerta:
        "Mimi escapou pela janela na Quadra 104 Norte. Ela não tem costume de ficar na rua e pode estar escondida em garagens próximas.",
      recompensa: "Recompensa garantida",
    },
    tutor: {
      nome: "Giovana Torres",
      telefone: "(63) 99280-1122",
      whatsapp: "5563992801122",
      email: "giovana.tutor@petsafe.com.br",
      cidade: "Palmas - TO",
      bairro: "Quadra 104 Norte",
      endereco_aproximado: "Quadra 104 Norte, Alameda 04, Palmas - TO",
      mostrar_endereco: true,
    },
    contatos_emergencia: [
      {
        id: "cont-m1",
        nome: "Giovana Torres",
        relacao: "Tutora Principal",
        telefone: "(63) 99280-1122",
        whatsapp: "5563992801122",
        prioridade: 1,
        observacao: "Disponível via WhatsApp e ligação.",
      },
      {
        id: "cont-m2",
        nome: "Grazyelle Nayara",
        relacao: "Familiar",
        telefone: "(63) 98401-7755",
        whatsapp: "5563984017755",
        prioridade: 2,
        observacao: "Mora próximo à Quadra 104 Norte.",
      },
    ],
    ficha_medica: {
      castrado: true,
      peso_kg: 3.8,
      vacinas_em_dia: true,
      ultima_vacina: "Quíntupla Felina (V5) + Antirrábica",
      alergias: ["Nenhuma alergia medicamentosa conhecida"],
      medicacoes: ["Nenhuma medicação contínua"],
      restricoes_alimentares: "Apenas ração para gatos ou sachê úmido; não dar leite de vaca.",
      veterinario_nome: "Dr. Rafael Lima — Felinos & Cia",
      veterinario_telefone: "(63) 3218-9900",
      cuidados_especiais: "Sensível a estresse; manter em local fechado e silencioso até a chegada da tutora.",
    },
  },
  {
    id: "demo-pet-3",
    nome: "Thor",
    especie: "Cachorro",
    raca: "Bulldog Francês",
    data_nascimento: "2022-11-05",
    idade: "3 anos",
    porte: "Médio",
    sexo: "Macho",
    cor: "Tigrado com branco",
    comportamento: "Muito carinhoso, tranquilo e acostumado a passear de coleira.",
    cidade: "Palmas - TO",
    bairro: "Orla da Graciosa",
    observacoes:
      "Visto pela última vez próximo aos quiosques da Orla da Graciosa.",
    tag: {
      codigo: "PS-2026-0303",
      ativa: true,
      tipo: "qrcode_nfc",
      status_alerta: "perdido",
      mensagem_alerta:
        "Thor se soltou durante o passeio na Orla da Graciosa. Por ter focinho curto, precisa de sombra e água fresca!",
      recompensa: "Gratifica-se quem encontrar",
    },
    tutor: {
      nome: "Ricardo Lopes Tomaz",
      telefone: "(63) 99911-5544",
      whatsapp: "5563999115544",
      email: "ricardo.tutor@petsafe.com.br",
      cidade: "Palmas - TO",
      bairro: "Graciosa",
      endereco_aproximado: "Região da Orla da Graciosa, Palmas - TO",
      mostrar_endereco: true,
    },
    contatos_emergencia: [
      {
        id: "cont-t1",
        nome: "Ricardo Lopes",
        relacao: "Tutor Principal",
        telefone: "(63) 99911-5544",
        whatsapp: "5563999115544",
        prioridade: 1,
        observacao: "Atendimento imediato por WhatsApp ou telefone.",
      },
      {
        id: "cont-t2",
        nome: "Ayrton Miranda",
        relacao: "Contato de Apoio",
        telefone: "(63) 99203-6611",
        whatsapp: "5563992036611",
        prioridade: 2,
      },
    ],
    ficha_medica: {
      castrado: true,
      peso_kg: 12.4,
      vacinas_em_dia: true,
      ultima_vacina: "V10 + Gripe Canina + Antirrábica",
      alergias: ["Dermatite a grama recém-cortada", "Alergia a frango"],
      medicacoes: ["Colírio lubrificante ocular 1x ao dia"],
      restricoes_alimentares: "Dieta sem frango (apenas ração hipoalergênica).",
      veterinario_nome: "Hospital Veterinário UFT / Palmas",
      veterinario_telefone: "(63) 3229-4500",
      cuidados_especiais: "Evitar calor excessivo (risco de falta de ar por ser braquicefálico).",
    },
  },
];

let petsEmMemoria: Pet[] = [...MOCK_PETS];

export function enriquecerPerfilPublicoPet(petParcial: PetDTO): PetDTO {
  const baseMock =
    petsEmMemoria.find(
      (p) =>
        p.id === petParcial.id ||
        (petParcial.tag?.codigo && p.tag?.codigo === petParcial.tag.codigo)
    ) || petsEmMemoria[0];

  const contatos = (
    petParcial.contatos_emergencia && petParcial.contatos_emergencia.length > 0
      ? petParcial.contatos_emergencia
      : baseMock.contatos_emergencia || []
  )
    .slice()
    .sort((a, b) => a.prioridade - b.prioridade);

  return {
    ...baseMock,
    ...petParcial,
    idade: petParcial.idade || baseMock.idade || "2 anos",
    porte: petParcial.porte || baseMock.porte || "Médio",
    sexo: petParcial.sexo || baseMock.sexo || "Macho",
    cor: petParcial.cor || baseMock.cor || "Caramelo",
    comportamento:
      petParcial.comportamento ||
      baseMock.comportamento ||
      "Dócil e acostumado com pessoas.",
    cidade: petParcial.cidade || baseMock.cidade || "Palmas - TO",
    bairro: petParcial.bairro || baseMock.bairro || "Plano Diretor Sul",
    observacoes:
      petParcial.observacoes ||
      baseMock.observacoes ||
      "Pet identificado com medalha inteligente PetSafe.",
    tag: {
      ...baseMock.tag,
      ...(petParcial.tag || {}),
      codigo:
        petParcial.tag?.codigo ||
        baseMock.tag?.codigo ||
        `PS-2026-${(petParcial.id || "0001").slice(-4).toUpperCase()}`,
      ativa: petParcial.tag?.ativa ?? true,
    },
    tutor: {
      ...baseMock.tutor,
      ...(petParcial.tutor || {}),
      nome: petParcial.tutor?.nome || baseMock.tutor?.nome || "Tutor PetSafe",
      telefone:
        petParcial.tutor?.telefone ||
        baseMock.tutor?.telefone ||
        "(63) 99245-8810",
    },
    contatos_emergencia: contatos,
    ficha_medica: {
      ...baseMock.ficha_medica,
      ...(petParcial.ficha_medica || {}),
    },
  };
}

// CREATE
export async function criarPet(pet: Pet) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const { data, error } = await supabase
    .from("pets")
    .insert({ ...pet, tutor_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// READ - lista os pets do tutor logado
export async function listarMeusPets() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("tutor_id", user.id);

      if (!error && data && data.length > 0) {
        return data.map((p: PetDTO) => enriquecerPerfilPublicoPet(p));
      }
    }
    return petsEmMemoria;
  } catch {
    return petsEmMemoria;
  }
}

// READ PÚBLICO - lista todos os pets perdidos / com tag ativa para a página pública
export async function listarPetsPublicos(): Promise<Pet[]> {
  try {
    const { data, error } = await supabase.from("pets").select("*");
    if (!error && data && data.length > 0) {
      return data.map((p: PetDTO) => enriquecerPerfilPublicoPet(p));
    }
    return petsEmMemoria;
  } catch {
    return petsEmMemoria;
  }
}

// READ - um pet específico
export async function getPet(idOuCodigo: string): Promise<Pet> {
  const chaveLimpa = decodeURIComponent(idOuCodigo).trim();

  const porCodigoMemoria = petsEmMemoria.find(
    (p) =>
      p.id === chaveLimpa ||
      p.tag?.codigo?.toLowerCase() === chaveLimpa.toLowerCase()
  );

  try {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("id", chaveLimpa)
      .single();

    if (!error && data) {
      return enriquecerPerfilPublicoPet(data as PetDTO);
    }

    return porCodigoMemoria || petsEmMemoria[0];
  } catch {
    return porCodigoMemoria || petsEmMemoria[0];
  }
}

export async function getPerfilPublicoPet(idOuCodigo: string): Promise<Pet> {
  return getPet(idOuCodigo);
}

export async function alternarStatusAlertaPet(
  id: string,
  novoStatus: StatusAlertaPet
): Promise<Pet> {
  const idx = petsEmMemoria.findIndex((p) => p.id === id);
  if (idx >= 0) {
    const atual = petsEmMemoria[idx];
    const atualizado: Pet = {
      ...atual,
      tag: {
        codigo: atual.tag?.codigo || "PS-2026-0101",
        ativa: true,
        ...atual.tag,
        status_alerta: novoStatus,
        mensagem_alerta:
          novoStatus === "perdido"
            ? `${atual.nome} está sendo procurado(a)! Se você escaneou esta medalha, por favor compartilhe a localização atual ou entre em contato com o tutor.`
            : "Medalha PetSafe ativa e verificada. Todas as informações abaixo estão atualizadas.",
      },
    };
    petsEmMemoria[idx] = atualizado;
    return atualizado;
  }

  const pet = await getPet(id);
  return {
    ...pet,
    tag: {
      codigo: pet.tag?.codigo || "PS-2026-0101",
      ativa: true,
      ...pet.tag,
      status_alerta: novoStatus,
    },
  };
}

// UPDATE
export async function atualizarPet(id: string, campos: Partial<Pet>) {
  const { data, error } = await supabase
    .from("pets")
    .update(campos)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// DELETE
export async function deletarPet(id: string) {
  const { error } = await supabase.from("pets").delete().eq("id", id);
  if (error) throw error;
}
