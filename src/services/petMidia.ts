import { supabase } from "@/lib/supabaseClient";

const BUCKET = "pets-midia";

export type ArquivoSelecionado = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function extensaoDoArquivo(arquivo: ArquivoSelecionado, padrao: string) {
  const doNome = arquivo.fileName?.includes(".")
    ? arquivo.fileName.split(".").pop()
    : undefined;
  const doMime = arquivo.mimeType?.split("/")[1];
  const ext = (doNome || doMime || padrao).toLowerCase();
  return ext === "quicktime" ? "mov" : ext;
}

// Envia foto ou vídeo para o Storage e devolve a URL pública
export async function enviarMidiaPet(
  arquivo: ArquivoSelecionado,
  tipo: "foto" | "video",
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const ext = extensaoDoArquivo(arquivo, tipo === "foto" ? "jpg" : "mp4");
  const caminho = `${user.id}/${tipo}-${Date.now()}.${ext}`;
  const contentType =
    arquivo.mimeType || `${tipo === "foto" ? "image" : "video"}/${ext}`;

  const resposta = await fetch(arquivo.uri);
  const conteudo = await resposta.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, conteudo, { contentType, upsert: false });

  if (error) throw new Error(`Falha ao enviar ${tipo}: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
  return data.publicUrl;
}
