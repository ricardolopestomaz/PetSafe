import { AtualizarPetPayload, CriarPetPayload, PetDTO } from "@/@types/pet";
import { supabase } from "@/lib/supabaseClient";

export type Pet = PetDTO;
export type { AtualizarPetPayload, CriarPetPayload, PetDTO };

// Deixe false para ver só os dados reais do banco.
// Mude para true apenas em demonstrações sem login.
const USAR_MOCK = false;

export const MOCK_PETS: Pet[] = [
  {
    id: "demo-pet-1",
    nome: "Pipoca",
    especie: "Cachorro",
    raca: "Golden Retriever",
    observacoes: "Dócil, brincalhão e com coleira inteligente PetSafe ativa.",
  },
  {
    id: "demo-pet-2",
    nome: "Mimi",
    especie: "Gato",
    raca: "Siamês",
    observacoes: "Gata dócil, castrada.",
  },
  {
    id: "demo-pet-3",
    nome: "Thor",
    especie: "Cachorro",
    raca: "Bulldog Francês",
    observacoes: "Muito carinhoso.",
  },
];

// CREATE
export async function criarPet(pet: CriarPetPayload) {
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
export async function listarMeusPets(): Promise<Pet[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return USAR_MOCK ? MOCK_PETS : [];

  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("tutor_id", user.id)
    .order("criado_em", { ascending: false });

  if (error) {
    console.warn("[listarMeusPets]", error.message);
    return USAR_MOCK ? MOCK_PETS : [];
  }

  return data ?? [];
}

// READ - um pet específico
export async function getPet(id: string) {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("id", id)
    .single();

  if (!error && data) return data;

  if (USAR_MOCK) {
    return MOCK_PETS.find((p) => p.id === id) || MOCK_PETS[0];
  }
  throw error ?? new Error("Pet não encontrado");
}

// UPDATE - só aceita os campos editáveis (AtualizarPetPayload)
export async function atualizarPet(id: string, campos: AtualizarPetPayload) {
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
