import { supabase } from "@/lib/supabaseClient";

export type FichaMedica = {
  pet_id: string;
  peso_kg?: number | null;
  castrado?: boolean | null;
  tipo_sanguineo?: string | null;
  microchip?: string | null;
  alergias?: string | null;
  doencas_cronicas?: string | null;
  medicamentos_uso?: string | null;
  veterinario_nome?: string | null;
  veterinario_telefone?: string | null;
  observacoes_medicas?: string | null;
  atualizado_em?: string | null;
};

export type CamposFichaMedica = Partial<
  Omit<FichaMedica, "pet_id" | "atualizado_em">
>;

// Devolve a ficha do pet, ou null se ainda não foi preenchida
export async function getFichaMedica(
  petId: string,
): Promise<FichaMedica | null> {
  const { data, error } = await supabase
    .from("ficha_medica")
    .select("*")
    .eq("pet_id", petId)
    .maybeSingle();

  if (error) throw error;
  return (data as FichaMedica) ?? null;
}

// Cria a ficha na primeira vez e atualiza nas seguintes
export async function salvarFichaMedica(
  petId: string,
  campos: CamposFichaMedica,
) {
  const { data, error } = await supabase
    .from("ficha_medica")
    .upsert(
      { ...campos, pet_id: petId, atualizado_em: new Date().toISOString() },
      { onConflict: "pet_id" },
    )
    .select()
    .single();

  if (error) throw error;
  return data as FichaMedica;
}
