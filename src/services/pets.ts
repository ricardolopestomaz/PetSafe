import { supabase } from '@/lib/supabase'

export type Pet = {
  id?: string
  tutor_id?: string
  nome: string
  especie?: string
  raca?: string
  data_nascimento?: string
  foto_url?: string
  video_url?: string
  observacoes?: string
}

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
export async function criarPet(pet: Pet) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Usuário não autenticado')

  const { data, error } = await supabase
    .from('pets')
    .insert({ ...pet, tutor_id: user.id })
    .select()
    .single()

  if (error) throw error
  return data
}

// READ - lista os pets do tutor logado
export async function listarMeusPets() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('tutor_id', user.id)

      if (!error && data && data.length > 0) return data
    }
    return MOCK_PETS
  } catch {
    return MOCK_PETS
  }
}

// READ - um pet específico
export async function getPet(id: string) {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', id)
      .single()

    if (!error && data) return data
    return MOCK_PETS.find((p) => p.id === id) || MOCK_PETS[0]
  } catch {
    return MOCK_PETS.find((p) => p.id === id) || MOCK_PETS[0]
  }
}

// UPDATE
export async function atualizarPet(id: string, campos: Partial<Pet>) {
  const { data, error } = await supabase
    .from('pets')
    .update(campos)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// DELETE
export async function deletarPet(id: string) {
  const { error } = await supabase.from('pets').delete().eq('id', id)
  if (error) throw error
}