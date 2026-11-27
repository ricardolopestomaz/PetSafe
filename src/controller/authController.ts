import * as AuthModel from '@/model/authModel';
import { PerfilUsuarioDTO, PreferenciasTutorDTO } from '@/@types/auth';
import { ArquivoSelecionado, enviarFotoPerfil } from '@/services/petMidia';

type Resultado = {
  sucesso: boolean;
  mensagem?: string;
};

type ResultadoCadastro = Resultado & {
  possuiSessao?: boolean;
};

function emailValido(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export async function realizarLogin(
  email: string,
  senha: string
): Promise<Resultado> {
  const emailLimpo = email.trim();

  if (!emailLimpo || !senha) {
    return {
      sucesso: false,
      mensagem: 'Preencha o e-mail e a senha.',
    };
  }

  if (!emailValido(emailLimpo)) {
    return {
      sucesso: false,
      mensagem: 'Digite um e-mail válido.',
    };
  }

  const res = await AuthModel.login(emailLimpo, senha);
  if (!res.sucesso) {
    if (res.mensagem?.includes('Forbidden use of secret API key')) {
      return {
        sucesso: false,
        mensagem:
          'Chave de API incorreta: Foi configurada a chave SECRETA (sb_secret_...). No painel do Supabase, copie a chave "anon" / "publishable" e cole no arquivo .env.',
      };
    }
    return {
      sucesso: false,
      mensagem: res.mensagem || 'Erro ao realizar login.',
    };
  }

  return {
    sucesso: true,
  };
}

export async function realizarLoginGoogle(): Promise<Resultado> {
  const res = await AuthModel.loginComGoogle();
  if (!res.sucesso) {
    if (res.mensagem?.includes('Forbidden use of secret API key')) {
      return {
        sucesso: false,
        mensagem:
          'Chave de API incorreta: Foi configurada a chave SECRETA (sb_secret_...). No painel do Supabase, copie a chave "anon" / "publishable" e cole no arquivo .env.',
      };
    }
    return {
      sucesso: false,
      mensagem: res.mensagem || 'Erro ao realizar login com o Google.',
    };
  }

  return {
    sucesso: true,
  };
}

export async function carregarUsuarioAtual(): Promise<PerfilUsuarioDTO | null> {
  return await AuthModel.obterUsuarioAtual();
}

export async function realizarCadastro(
  nome: string,
  email: string,
  senha: string,
  confirmarSenha: string
): Promise<ResultadoCadastro> {
  const nomeLimpo = nome.trim();
  const emailLimpo = email.trim();

  if (!nomeLimpo || !emailLimpo || !senha || !confirmarSenha) {
    return {
      sucesso: false,
      mensagem: 'Preencha todos os campos.',
    };
  }

  if (!emailValido(emailLimpo)) {
    return {
      sucesso: false,
      mensagem: 'Digite um e-mail válido.',
    };
  }

  if (senha !== confirmarSenha) {
    return {
      sucesso: false,
      mensagem: 'As senhas não são iguais.',
    };
  }

  const res = await AuthModel.cadastrar(nomeLimpo, emailLimpo, senha);
  if (!res.sucesso) {
    if (res.mensagem?.includes('Forbidden use of secret API key')) {
      return {
        sucesso: false,
        mensagem:
          'Chave de API incorreta: Foi configurada a chave SECRETA (sb_secret_...). No painel do Supabase, copie a chave "anon" / "publishable" e cole no arquivo .env.',
      };
    }
    return {
      sucesso: false,
      mensagem: res.mensagem || 'Erro ao realizar cadastro.',
    };
  }

  return {
    sucesso: true,
    possuiSessao: Boolean(res.data?.session),
  };
}

type ResultadoPerfil = Resultado & {
  // true quando foi pedida a troca de e-mail e falta o tutor confirmar no novo endereço
  emailPendente?: boolean;
};

export type DadosPerfilFormulario = {
  nome: string;
  telefone: string;
  email: string;
  emailAtual: string;
  fotoAtualUrl: string | null; // null = sem foto (ou removida)
  novaFoto?: ArquivoSelecionado | null;
};

const SENHA_MINIMA = 6;

function apenasDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

export async function salvarPerfil(
  dados: DadosPerfilFormulario,
): Promise<ResultadoPerfil> {
  const nomeLimpo = dados.nome.trim().replace(/\s+/g, " ");
  const emailLimpo = dados.email.trim().toLowerCase();
  const telefoneLimpo = dados.telefone.trim();
  const digitos = apenasDigitos(telefoneLimpo);

  if (nomeLimpo.length < 2) {
    return { sucesso: false, mensagem: 'Informe seu nome completo.' };
  }

  if (!emailValido(emailLimpo)) {
    return { sucesso: false, mensagem: 'Digite um e-mail válido.' };
  }

  // Telefone é opcional; se informado, precisa ter DDD + número (10 ou 11 dígitos)
  if (digitos && (digitos.length < 10 || digitos.length > 11)) {
    return {
      sucesso: false,
      mensagem: 'Telefone inválido. Use DDD + número, ex.: (63) 99999-9999.',
    };
  }

  let fotoPerfilUrl = dados.fotoAtualUrl;
  if (dados.novaFoto) {
    try {
      fotoPerfilUrl = await enviarFotoPerfil(dados.novaFoto);
    } catch (e: any) {
      return {
        sucesso: false,
        mensagem: e?.message || 'Não foi possível enviar a foto de perfil.',
      };
    }
  }

  const res = await AuthModel.atualizarPerfil({
    nome: nomeLimpo,
    telefone: digitos ? telefoneLimpo : null,
    fotoPerfilUrl,
  });
  if (!res.sucesso) {
    return {
      sucesso: false,
      mensagem: res.mensagem || 'Erro ao salvar seu perfil.',
    };
  }

  // Troca de e-mail é feita pelo Supabase Auth, com confirmação por link
  if (emailLimpo !== dados.emailAtual.trim().toLowerCase()) {
    const resEmail = await AuthModel.solicitarTrocaEmail(emailLimpo);
    if (!resEmail.sucesso) {
      return {
        sucesso: false,
        mensagem: `Seus dados foram salvos, mas o e-mail não foi alterado: ${resEmail.mensagem}`,
      };
    }
    return { sucesso: true, emailPendente: true };
  }

  return { sucesso: true };
}

export async function alterarSenha(
  email: string,
  possuiSenha: boolean,
  senhaAtual: string,
  novaSenha: string,
  confirmarSenha: string,
): Promise<Resultado> {
  if ((possuiSenha && !senhaAtual) || !novaSenha || !confirmarSenha) {
    return { sucesso: false, mensagem: 'Preencha todos os campos de senha.' };
  }

  if (novaSenha.length < SENHA_MINIMA) {
    return {
      sucesso: false,
      mensagem: `A nova senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`,
    };
  }

  if (novaSenha !== confirmarSenha) {
    return { sucesso: false, mensagem: 'As senhas não são iguais.' };
  }

  if (possuiSenha) {
    if (novaSenha === senhaAtual) {
      return {
        sucesso: false,
        mensagem: 'A nova senha precisa ser diferente da atual.',
      };
    }

    // Reautentica para confirmar que é o próprio tutor alterando a senha
    const senhaCorreta = await AuthModel.verificarSenha(email, senhaAtual);
    if (!senhaCorreta) {
      return { sucesso: false, mensagem: 'A senha atual está incorreta.' };
    }
  }

  const res = await AuthModel.atualizarSenha(novaSenha);
  if (!res.sucesso) {
    return {
      sucesso: false,
      mensagem: res.mensagem || 'Erro ao alterar a senha.',
    };
  }

  return { sucesso: true };
}

export async function salvarPreferencias(
  preferencias: PreferenciasTutorDTO,
): Promise<Resultado> {
  const res = await AuthModel.salvarPreferencias(preferencias);
  if (!res.sucesso) {
    return {
      sucesso: false,
      mensagem: res.mensagem || 'Não foi possível salvar suas preferências.',
    };
  }
  return { sucesso: true };
}

export async function realizarRedefinicaoSenha(
  novaSenha: string,
  confirmarSenha: string
): Promise<Resultado> {
  if (!novaSenha || !confirmarSenha) {
    return {
      sucesso: false,
      mensagem: 'Preencha os dois campos de senha.',
    };
  }

  if (novaSenha !== confirmarSenha) {
    return {
      sucesso: false,
      mensagem: 'As senhas não são iguais.',
    };
  }

  const res = await AuthModel.atualizarSenha(novaSenha);
  if (!res.sucesso) {
    return {
      sucesso: false,
      mensagem: res.mensagem || 'Erro ao atualizar senha.',
    };
  }

  return {
    sucesso: true,
  };
}