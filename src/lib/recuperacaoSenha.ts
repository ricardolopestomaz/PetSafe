// Marca que a sessão atual veio de um link de "esqueci minha senha".
// Enquanto estiver ativa, o _layout não manda o usuário para (tabs):
// ele precisa concluir (ou cancelar) a redefinição em redefinir_senha.
let emAndamento = false;

export function iniciarRecuperacaoSenha() {
  emAndamento = true;
}

export function finalizarRecuperacaoSenha() {
  emAndamento = false;
}

export function recuperacaoSenhaEmAndamento() {
  return emAndamento;
}
