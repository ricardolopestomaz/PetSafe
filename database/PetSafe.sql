-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  email text UNIQUE,
  telefone text,
  endereco text,
  foto_perfil_url text,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT usuarios_pkey PRIMARY KEY (id),
  CONSTRAINT usuarios_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.planos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  preco_mensal numeric NOT NULL,
  preco_anual numeric NOT NULL,
  max_pets integer NOT NULL,
  alerta_instantaneo boolean DEFAULT false,
  carteira_vacina boolean DEFAULT false,
  historico_medico boolean DEFAULT false,
  video_tutor boolean DEFAULT false,
  mapa_completo boolean DEFAULT false,
  CONSTRAINT planos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.assinaturas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL,
  plano_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ativa'::text,
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  CONSTRAINT assinaturas_pkey PRIMARY KEY (id),
  CONSTRAINT assinaturas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id),
  CONSTRAINT assinaturas_plano_id_fkey FOREIGN KEY (plano_id) REFERENCES public.planos(id)
);
CREATE TABLE public.pagamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assinatura_id uuid NOT NULL,
  valor numeric NOT NULL,
  data_pagamento timestamp with time zone DEFAULT now(),
  status text NOT NULL DEFAULT 'pendente'::text,
  metodo text,
  CONSTRAINT pagamentos_pkey PRIMARY KEY (id),
  CONSTRAINT pagamentos_assinatura_id_fkey FOREIGN KEY (assinatura_id) REFERENCES public.assinaturas(id)
);
CREATE TABLE public.pets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL,
  nome text NOT NULL,
  especie text,
  raca text,
  data_nascimento date,
  foto_url text,
  video_url text,
  observacoes text,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT pets_pkey PRIMARY KEY (id),
  CONSTRAINT pets_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.pet_tutores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  papel text NOT NULL DEFAULT 'cuidador'::text,
  CONSTRAINT pet_tutores_pkey PRIMARY KEY (id),
  CONSTRAINT pet_tutores_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id),
  CONSTRAINT pet_tutores_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);
CREATE TABLE public.contatos_emergencia (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  nome text NOT NULL,
  telefone text NOT NULL,
  prioridade integer DEFAULT 1,
  CONSTRAINT contatos_emergencia_pkey PRIMARY KEY (id),
  CONSTRAINT contatos_emergencia_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.vacinas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  nome_vacina text NOT NULL,
  data_aplicacao date,
  proxima_dose date,
  veterinario text,
  comprovante_url text,
  CONSTRAINT vacinas_pkey PRIMARY KEY (id),
  CONSTRAINT vacinas_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.historico_medico (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL,
  tipo text,
  descricao text,
  data date,
  clinica text,
  anexo_url text,
  CONSTRAINT historico_medico_pkey PRIMARY KEY (id),
  CONSTRAINT historico_medico_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.medalhas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid,
  codigo_qr text NOT NULL UNIQUE,
  nft_token_id text,
  contract_address text,
  wallet_address text,
  blockchain text,
  status text NOT NULL DEFAULT 'ativa'::text,
  data_ativacao timestamp with time zone DEFAULT now(),
  CONSTRAINT medalhas_pkey PRIMARY KEY (id),
  CONSTRAINT medalhas_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.leituras (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  medalha_id uuid NOT NULL,
  latitude double precision,
  longitude double precision,
  endereco_aprox text,
  encontrado_nome text,
  encontrado_telefone text,
  mensagem text,
  foto_url text,
  ip_address text,
  criado_em timestamp with time zone DEFAULT now(),
  CONSTRAINT leituras_pkey PRIMARY KEY (id),
  CONSTRAINT leituras_medalha_id_fkey FOREIGN KEY (medalha_id) REFERENCES public.medalhas(id)
);
CREATE TABLE public.notificacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  leitura_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  canal text NOT NULL,
  status_envio text NOT NULL DEFAULT 'pendente'::text,
  enviado_em timestamp with time zone,
  CONSTRAINT notificacoes_pkey PRIMARY KEY (id),
  CONSTRAINT notificacoes_leitura_id_fkey FOREIGN KEY (leitura_id) REFERENCES public.leituras(id),
  CONSTRAINT notificacoes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id)
);