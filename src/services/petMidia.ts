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

// Remove do Storage arquivos que deixaram de ser usados (foto/vídeo trocado,
// pet excluído ou cadastro que falhou). É "melhor esforço": se o Storage
// recusar, a operação principal não é desfeita, só fica o arquivo sobrando.
export async function removerMidias(urls: (string | null | undefined)[]) {
  const marcador = `/object/public/${BUCKET}/`;
  const caminhos = urls
    .filter((url): url is string => Boolean(url) && url!.includes(marcador))
    .map((url) => decodeURIComponent(url.split(marcador)[1].split("?")[0]));

  if (caminhos.length === 0) return;

  try {
    const { error } = await supabase.storage.from(BUCKET).remove(caminhos);
    if (error) console.warn("[removerMidias]", error.message);
  } catch (e) {
    console.warn("[removerMidias] Falha na requisição:", e);
  }
}

// Envia a foto de perfil do tutor (mesmo bucket, mesma pasta do usuário)
export async function enviarFotoPerfil(
  arquivo: ArquivoSelecionado,
): Promise<string> {
  return enviarParaPastaDoUsuario(arquivo, "perfil", "image", "foto de perfil");
}
