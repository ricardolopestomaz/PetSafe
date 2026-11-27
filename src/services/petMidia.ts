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

// Envia um arquivo para a pasta do usuário logado no Storage e devolve a URL pública.
// O caminho sempre começa com o id do usuário ({user.id}/...), padrão das políticas do bucket.
async function enviarParaPastaDoUsuario(
  arquivo: ArquivoSelecionado,
  prefixo: string,
  midia: "image" | "video",
  rotulo: string,
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");

  const ext = extensaoDoArquivo(arquivo, midia === "image" ? "jpg" : "mp4");
  const caminho = `${user.id}/${prefixo}-${Date.now()}.${ext}`;
  const contentType = arquivo.mimeType || `${midia}/${ext}`;

  const resposta = await fetch(arquivo.uri);
  const conteudo = await resposta.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, conteudo, { contentType, upsert: false });

  if (error) throw new Error(`Falha ao enviar ${rotulo}: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(caminho);
  return data.publicUrl;
}

// Envia foto ou vídeo do pet para o Storage e devolve a URL pública
export async function enviarMidiaPet(
  arquivo: ArquivoSelecionado,
  tipo: "foto" | "video",
): Promise<string> {
  return enviarParaPastaDoUsuario(
    arquivo,
    tipo,
    tipo === "foto" ? "image" : "video",
    tipo,
  );
}

// Envia a foto de perfil do tutor (mesmo bucket, mesma pasta do usuário)
export async function enviarFotoPerfil(
  arquivo: ArquivoSelecionado,
): Promise<string> {
  return enviarParaPastaDoUsuario(arquivo, "perfil", "image", "foto de perfil");
}
