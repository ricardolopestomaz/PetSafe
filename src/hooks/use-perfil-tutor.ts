import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { PerfilUsuarioDTO } from '@/@types/auth';
import * as AuthController from '@/controller/authController';

// Carrega o perfil do tutor logado e recarrega sempre que a tela volta ao foco
// (ex.: depois de salvar em /conta/editar).
export function usePerfilTutor() {
  const [perfil, setPerfil] = useState<PerfilUsuarioDTO | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const carregouUmaVez = useRef(false);

  const carregar = useCallback(async () => {
    // Só mostra o carregamento de tela cheia na primeira vez
    if (!carregouUmaVez.current) setCarregando(true);
    setErro(null);
    try {
      const dados = await AuthController.carregarUsuarioAtual();
      if (!dados) {
        setErro('Não foi possível identificar sua conta. Entre novamente.');
      }
      setPerfil(dados);
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível carregar seu perfil.');
    } finally {
      carregouUmaVez.current = true;
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  return { perfil, setPerfil, carregando, erro, recarregar: carregar };
}
