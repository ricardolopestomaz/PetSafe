import { AtualizarPetPayload } from '@/@types/pet';
import {
  ArquivoSelecionado,
  enviarMidiaPet,
  removerMidias,
} from '@/services/petMidia';
import { atualizarPet, criarPet, deletarPet, Pet } from '@/services/pets';

type Resultado = {
  sucesso: boolean;
  mensagem?: string;
};

export const ESPECIES = ['Cachorro', 'Gato', 'Outro'];
export const LIMITE_VIDEO_MB = 50;

// Estado do formulário de pet (usado no cadastro e na edição)
export type FormularioPet = {
  nome: string;
  especie: string;
  raca: string;
  dataNascimento: string; // DD/MM/AAAA (pode ser vazio)
  observacoes: string;
  fotoUrlAtual: string | null; // foto já salva (null = sem foto ou removida)
  novaFoto: ArquivoSelecionado | null;
  videoUrlAtual: string | null;
  novoVideo: ArquivoSelecionado | null;
};

/* ----------------------------- Datas e idade ----------------------------- */

// Aplica a máscara DD/MM/AAAA enquanto a pessoa digita
export function mascararData(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

// AAAA-MM-DD (banco) -> DD/MM/AAAA (formulário)
export function isoParaData(iso?: string | null) {
  if (!iso) return '';
  const [aaaa, mm, dd] = iso.slice(0, 10).split('-');
  if (!aaaa || !mm || !dd) return '';
  return `${dd}/${mm}/${aaaa}`;
}

// DD/MM/AAAA -> AAAA-MM-DD. Vazio é permitido.
export function converterData(texto: string): { ok: boolean; iso?: string } {
  if (!texto.trim()) return { ok: true };
  if (texto.length !== 10) return { ok: false };

  const [dd, mm, aaaa] = texto.split('/').map(Number);
  const data = new Date(aaaa, mm - 1, dd);

  const existe =
    data.getFullYear() === aaaa &&
    data.getMonth() === mm - 1 &&
    data.getDate() === dd;

  if (!existe || aaaa < 1990 || data > new Date()) return { ok: false };

  const dois = (n: number) => String(n).padStart(2, '0');
  return { ok: true, iso: `${aaaa}-${dois(mm)}-${dois(dd)}` };
}

// Calcula a idade a partir de AAAA-MM-DD
export function calcularIdade(iso?: string | null): string | null {
  if (!iso) return null;
  const nascimento = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (isNaN(nascimento.getTime())) return null;

  const hoje = new Date();
  let meses =
    (hoje.getFullYear() - nascimento.getFullYear()) * 12 +
    (hoje.getMonth() - nascimento.getMonth());
  if (hoje.getDate() < nascimento.getDate()) meses--;

  if (meses < 0) return null;
  if (meses < 1) return 'Menos de 1 mês';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;

  const anos = Math.floor(meses / 12);
  return `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
}

// Preenche o formulário de edição com os dados atuais do pet
export function formularioDoPet(pet: Pet): FormularioPet {
  return {
    nome: pet.nome ?? '',
    especie: pet.especie || ESPECIES[0],
    raca: pet.raca ?? '',
    dataNascimento: isoParaData(pet.data_nascimento),
    observacoes: pet.observacoes ?? '',
    fotoUrlAtual: pet.foto_url ?? null,
    novaFoto: null,
    videoUrlAtual: pet.video_url ?? null,
    novoVideo: null,
  };
}

/* ------------------------------- Validação ------------------------------- */

function validar(form: FormularioPet): Resultado & { iso?: string } {
  if (!form.nome.trim()) {
    return { sucesso: false, mensagem: 'Informe o nome do pet.' };
  }

  const data = converterData(form.dataNascimento);
  if (!data.ok) {
    return {
      sucesso: false,
      mensagem: 'Data de nascimento inválida. Use o formato DD/MM/AAAA.',
    };
  }

  const tamanhoVideo = (form.novoVideo as { fileSize?: number } | null)?.fileSize;
  if (tamanhoVideo && tamanhoVideo > LIMITE_VIDEO_MB * 1024 * 1024) {
    return {
      sucesso: false,
      mensagem: `O vídeo deve ter no máximo ${LIMITE_VIDEO_MB} MB.`,
    };
  }

  return { sucesso: true, iso: data.iso };
}

function mensagemDeErro(e: any, padrao: string) {
  return e?.message || padrao;
}

/* -------------------------------- Ações --------------------------------- */

export async function cadastrarPet(
  form: FormularioPet,
): Promise<Resultado & { pet?: Pet }> {
  const validacao = validar(form);
  if (!validacao.sucesso) return validacao;

  // Arquivos enviados nesta tentativa (apagados se o cadastro falhar)
  const enviados: string[] = [];

  try {
    const foto_url = form.novaFoto
      ? await enviarMidiaPet(form.novaFoto, 'foto')
      : undefined;
    if (foto_url) enviados.push(foto_url);

    const video_url = form.novoVideo
      ? await enviarMidiaPet(form.novoVideo, 'video')
      : undefined;
    if (video_url) enviados.push(video_url);

    const pet = await criarPet({
      nome: form.nome.trim(),
      especie: form.especie,
      raca: form.raca.trim() || undefined,
      data_nascimento: validacao.iso,
      foto_url,
      video_url,
      observacoes: form.observacoes.trim() || undefined,
    });

    return { sucesso: true, pet };
  } catch (e) {
    await removerMidias(enviados);
    return {
      sucesso: false,
      mensagem: mensagemDeErro(e, 'Não foi possível cadastrar o pet.'),
    };
  }
}

export async function editarPet(
  petAtual: Pet,
  form: FormularioPet,
): Promise<Resultado & { pet?: Pet }> {
  const validacao = validar(form);
  if (!validacao.sucesso) return validacao;

  const enviados: string[] = [];

  try {
    let foto_url = form.fotoUrlAtual;
    if (form.novaFoto) {
      foto_url = await enviarMidiaPet(form.novaFoto, 'foto');
      enviados.push(foto_url);
    }

    let video_url = form.videoUrlAtual;
    if (form.novoVideo) {
      video_url = await enviarMidiaPet(form.novoVideo, 'video');
      enviados.push(video_url);
    }

    // Lista fechada de campos editáveis; vazio vira null para limpar no banco
    const campos: AtualizarPetPayload = {
      nome: form.nome.trim(),
      especie: form.especie,
      raca: form.raca.trim() || null,
      data_nascimento: validacao.iso ?? null,
      observacoes: form.observacoes.trim() || null,
      foto_url,
      video_url,
    };

    const pet = await atualizarPet(petAtual.id, campos);

    // Salvou: apaga do Storage a foto/vídeo que foram trocados ou removidos
    const naoUsadas = [
      petAtual.foto_url !== foto_url ? petAtual.foto_url : null,
      petAtual.video_url !== video_url ? petAtual.video_url : null,
    ];
    await removerMidias(naoUsadas);

    return { sucesso: true, pet };
  } catch (e) {
    await removerMidias(enviados);
    return {
      sucesso: false,
      mensagem: mensagemDeErro(e, 'Não foi possível salvar as alterações.'),
    };
  }
}

export async function excluirPet(pet: Pet): Promise<Resultado> {
  try {
    await deletarPet(pet.id);
  } catch (e: any) {
    // 23503 = violação de chave estrangeira: há registros ligados ao pet
    if (e?.code === '23503') {
      return {
        sucesso: false,
        mensagem:
          'Este pet possui medalha ou registros vinculados (vacinas, contatos de emergência ou histórico) e não pode ser excluído por enquanto.',
      };
    }
    return {
      sucesso: false,
      mensagem: mensagemDeErro(e, 'Não foi possível excluir o pet.'),
    };
  }

  await removerMidias([pet.foto_url, pet.video_url]);
  return { sucesso: true };
}
