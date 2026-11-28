-- ============================================================================
-- PetSafe — Estrutura Completa do Banco, Triggers, Índices, RLS e Storage
-- ============================================================================

-- 1. FUNÇÃO AUXILIAR DE ATUALIZAÇÃO DE TIMESTAMP
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

-- 2. TABELAS (em ordem de dependência de chaves estrangeiras)
create table if not exists public.usuarios (
  id uuid not null default auth.uid(),
  nome text not null,
  email text unique,
  telefone text,
  endereco text,
  foto_perfil_url text,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now(),
  constraint usuarios_pkey primary key (id),
  constraint usuarios_id_fkey foreign key (id) references auth.users(id) on delete cascade
);

create table if not exists public.planos (
  id uuid not null default gen_random_uuid(),
  nome text not null,
  preco_mensal numeric not null check (preco_mensal >= 0),
  preco_anual numeric not null check (preco_anual >= 0),
  max_pets integer not null check (max_pets >= 0),
  alerta_instantaneo boolean not null default false,
  carteira_vacina boolean not null default false,
  historico_medico boolean not null default false,
  video_tutor boolean not null default false,
  mapa_completo boolean not null default false,
  constraint planos_pkey primary key (id)
);

create table if not exists public.assinaturas (
  id uuid not null default gen_random_uuid(),
  usuario_id uuid not null,
  plano_id uuid not null,
  status text not null default 'ativa'::text,
  data_inicio timestamp with time zone not null default now(),
  data_fim timestamp with time zone,
  constraint assinaturas_pkey primary key (id),
  constraint assinaturas_usuario_id_fkey foreign key (usuario_id) references public.usuarios(id) on delete cascade,
  constraint assinaturas_plano_id_fkey foreign key (plano_id) references public.planos(id) on delete restrict
);

create table if not exists public.pagamentos (
  id uuid not null default gen_random_uuid(),
  assinatura_id uuid not null,
  valor numeric not null check (valor >= 0),
  data_pagamento timestamp with time zone not null default now(),
  status text not null default 'pendente'::text,
  metodo text,
  constraint pagamentos_pkey primary key (id),
  constraint pagamentos_assinatura_id_fkey foreign key (assinatura_id) references public.assinaturas(id) on delete cascade
);

create table if not exists public.pets (
  id uuid not null default gen_random_uuid(),
  tutor_id uuid not null default auth.uid(),
  nome text not null check (char_length(btrim(nome)) > 0),
  especie text,
  raca text,
  data_nascimento date,
  foto_url text,
  video_url text,
  observacoes text,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now(),
  constraint pets_pkey primary key (id),
  constraint pets_tutor_id_fkey foreign key (tutor_id) references public.usuarios(id) on delete cascade
);

create table if not exists public.pet_tutores (
  id uuid not null default gen_random_uuid(),
  pet_id uuid not null,
  usuario_id uuid not null,
  papel text not null default 'cuidador'::text,
  constraint pet_tutores_pkey primary key (id),
  constraint pet_tutores_pet_usuario_unique unique (pet_id, usuario_id),
  constraint pet_tutores_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete cascade,
  constraint pet_tutores_usuario_id_fkey foreign key (usuario_id) references public.usuarios(id) on delete cascade
);

create table if not exists public.contatos_emergencia (
  id uuid not null default gen_random_uuid(),
  pet_id uuid not null,
  nome text not null,
  telefone text not null,
  prioridade integer default 1,
  constraint contatos_emergencia_pkey primary key (id),
  constraint contatos_emergencia_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete cascade
);

create table if not exists public.vacinas (
  id uuid not null default gen_random_uuid(),
  pet_id uuid not null,
  nome_vacina text not null,
  data_aplicacao date,
  proxima_dose date,
  veterinario text,
  comprovante_url text,
  constraint vacinas_pkey primary key (id),
  constraint vacinas_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete cascade
);

create table if not exists public.historico_medico (
  id uuid not null default gen_random_uuid(),
  pet_id uuid not null,
  tipo text,
  descricao text,
  data date,
  clinica text,
  anexo_url text,
  constraint historico_medico_pkey primary key (id),
  constraint historico_medico_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete cascade
);

create table if not exists public.ficha_medica (
  pet_id uuid not null,
  peso_kg numeric check (peso_kg is null or (peso_kg > 0 and peso_kg <= 200)),
  castrado boolean,
  tipo_sanguineo text,
  microchip text,
  alergias text,
  doencas_cronicas text,
  medicamentos_uso text,
  veterinario_nome text,
  veterinario_telefone text,
  observacoes_medicas text,
  atualizado_em timestamp with time zone default now(),
  constraint ficha_medica_pkey primary key (pet_id),
  constraint ficha_medica_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete cascade
);

create table if not exists public.medalhas (
  id uuid not null default gen_random_uuid(),
  pet_id uuid,
  codigo_qr text not null unique,
  nft_token_id text,
  contract_address text,
  wallet_address text,
  blockchain text,
  status text not null default 'ativa'::text,
  data_ativacao timestamp with time zone default now(),
  constraint medalhas_pkey primary key (id),
  constraint medalhas_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete cascade
);

create table if not exists public.leituras (
  id uuid not null default gen_random_uuid(),
  medalha_id uuid not null,
  latitude double precision,
  longitude double precision,
  endereco_aprox text,
  encontrado_nome text,
  encontrado_telefone text,
  mensagem text,
  foto_url text,
  ip_address text,
  criado_em timestamp with time zone not null default now(),
  constraint leituras_pkey primary key (id),
  constraint leituras_medalha_id_fkey foreign key (medalha_id) references public.medalhas(id) on delete cascade
);

create table if not exists public.notificacoes (
  id uuid not null default gen_random_uuid(),
  leitura_id uuid not null,
  usuario_id uuid not null,
  canal text not null,
  status_envio text not null default 'pendente'::text,
  enviado_em timestamp with time zone,
  constraint notificacoes_pkey primary key (id),
  constraint notificacoes_leitura_id_fkey foreign key (leitura_id) references public.leituras(id) on delete cascade,
  constraint notificacoes_usuario_id_fkey foreign key (usuario_id) references public.usuarios(id) on delete cascade
);

-- Triggers de atualizado_em
drop trigger if exists trg_usuarios_atualizado_em on public.usuarios;
create trigger trg_usuarios_atualizado_em
  before update on public.usuarios
  for each row execute function public.set_atualizado_em();

drop trigger if exists trg_pets_atualizado_em on public.pets;
create trigger trg_pets_atualizado_em
  before update on public.pets
  for each row execute function public.set_atualizado_em();

drop trigger if exists trg_ficha_medica_atualizado_em on public.ficha_medica;
create trigger trg_ficha_medica_atualizado_em
  before update on public.ficha_medica
  for each row execute function public.set_atualizado_em();

-- 3. ÍNDICES EM TODAS AS CHAVES ESTRANGEIRAS E COLUNAS DE RLS/ORDENAÇÃO
create index if not exists idx_assinaturas_usuario_id on public.assinaturas (usuario_id);
create index if not exists idx_assinaturas_plano_id on public.assinaturas (plano_id);
create index if not exists idx_pagamentos_assinatura_id on public.pagamentos (assinatura_id);
create index if not exists idx_pets_tutor_criado_em on public.pets (tutor_id, criado_em desc);
create index if not exists idx_pet_tutores_pet_id on public.pet_tutores (pet_id);
create index if not exists idx_pet_tutores_usuario_id on public.pet_tutores (usuario_id);
create index if not exists idx_contatos_emergencia_pet_id on public.contatos_emergencia (pet_id);
create index if not exists idx_vacinas_pet_id on public.vacinas (pet_id);
create index if not exists idx_historico_medico_pet_id on public.historico_medico (pet_id);
create index if not exists idx_medalhas_pet_id on public.medalhas (pet_id);
create index if not exists idx_leituras_medalha_criado_em on public.leituras (medalha_id, criado_em desc);
create index if not exists idx_notificacoes_leitura_id on public.notificacoes (leitura_id);
create index if not exists idx_notificacoes_usuario_id on public.notificacoes (usuario_id);

-- =====================================================
-- A) TRIGGER: cria o usuário em "usuarios" ao criar conta
-- =====================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuarios (id, nome, email, foto_perfil_url)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'nome'), ''),
      nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(btrim(new.raw_user_meta_data->>'name'), ''),
      split_part(coalesce(new.email, 'usuario'), '@', 1)
    ),
    new.email,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'avatar_url'), ''),
      nullif(btrim(new.raw_user_meta_data->>'picture'), '')
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Corrige contas que já existam sem linha em usuarios
insert into public.usuarios (id, nome, email)
select id, split_part(coalesce(email, 'usuario'), '@', 1), email
from auth.users
on conflict (id) do nothing;

-- =====================================================
-- B) RLS: usuarios e pets
-- =====================================================
alter table public.usuarios enable row level security;
alter table public.pets enable row level security;

drop policy if exists "usuario ve o proprio perfil" on public.usuarios;
drop policy if exists "usuario cria o proprio perfil" on public.usuarios;
drop policy if exists "usuario edita o proprio perfil" on public.usuarios;

create policy "usuario ve o proprio perfil" on public.usuarios
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "usuario cria o proprio perfil" on public.usuarios
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "usuario edita o proprio perfil" on public.usuarios
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "tutor ve seus pets" on public.pets;
drop policy if exists "tutor cria seus pets" on public.pets;
drop policy if exists "tutor edita seus pets" on public.pets;
drop policy if exists "tutor apaga seus pets" on public.pets;

create policy "tutor ve seus pets" on public.pets
  for select to authenticated
  using ((select auth.uid()) = tutor_id);

create policy "tutor cria seus pets" on public.pets
  for insert to authenticated
  with check ((select auth.uid()) = tutor_id);

create policy "tutor edita seus pets" on public.pets
  for update to authenticated
  using ((select auth.uid()) = tutor_id)
  with check ((select auth.uid()) = tutor_id);

create policy "tutor apaga seus pets" on public.pets
  for delete to authenticated
  using ((select auth.uid()) = tutor_id);

-- O banco preenche o dono do pet sozinho
alter table public.pets alter column tutor_id set default auth.uid();

-- =====================================================
-- C) RLS: medalhas e leituras (histórico de escaneamento)
-- =====================================================
alter table public.medalhas enable row level security;
alter table public.leituras enable row level security;

drop policy if exists "tutor ve medalhas dos seus pets" on public.medalhas;
drop policy if exists "tutor cria medalhas dos seus pets" on public.medalhas;
drop policy if exists "tutor edita medalhas dos seus pets" on public.medalhas;
drop policy if exists "tutor apaga medalhas dos seus pets" on public.medalhas;

create policy "tutor ve medalhas dos seus pets" on public.medalhas
  for select to authenticated
  using (
    exists (
      select 1 from public.pets p
      where p.id = medalhas.pet_id and p.tutor_id = (select auth.uid())
    )
  );

create policy "tutor cria medalhas dos seus pets" on public.medalhas
  for insert to authenticated
  with check (
    pet_id is not null and exists (
      select 1 from public.pets p
      where p.id = medalhas.pet_id and p.tutor_id = (select auth.uid())
    )
  );

create policy "tutor edita medalhas dos seus pets" on public.medalhas
  for update to authenticated
  using (
    exists (
      select 1 from public.pets p
      where p.id = medalhas.pet_id and p.tutor_id = (select auth.uid())
    )
  )
  with check (
    pet_id is not null and exists (
      select 1 from public.pets p
      where p.id = medalhas.pet_id and p.tutor_id = (select auth.uid())
    )
  );

create policy "tutor apaga medalhas dos seus pets" on public.medalhas
  for delete to authenticated
  using (
    exists (
      select 1 from public.pets p
      where p.id = medalhas.pet_id and p.tutor_id = (select auth.uid())
    )
  );

drop policy if exists "tutor ve leituras dos seus pets" on public.leituras;
drop policy if exists "registrar leitura em medalha ativa" on public.leituras;

create policy "tutor ve leituras dos seus pets" on public.leituras
  for select to authenticated
  using (
    exists (
      select 1 from public.medalhas m
      join public.pets p on p.id = m.pet_id
      where m.id = leituras.medalha_id and p.tutor_id = (select auth.uid())
    )
  );

create policy "registrar leitura em medalha ativa" on public.leituras
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.medalhas m
      where m.id = leituras.medalha_id
        and m.status = 'ativa'
        and m.pet_id is not null
    )
  );

alter table public.ficha_medica enable row level security;

drop policy if exists "tutor gerencia ficha medica dos seus pets" on public.ficha_medica;
create policy "tutor gerencia ficha medica dos seus pets" on public.ficha_medica
  for all to authenticated
  using (
    exists (
      select 1 from public.pets p
      where p.id = ficha_medica.pet_id and p.tutor_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.pets p
      where p.id = ficha_medica.pet_id and p.tutor_id = (select auth.uid())
    )
  );

-- =====================================================
-- D) Demais tabelas: RLS ligado (sem policies = acesso bloqueado
--    até essas funções serem desenvolvidas)
-- =====================================================
alter table public.planos enable row level security;
alter table public.assinaturas enable row level security;
alter table public.pagamentos enable row level security;
alter table public.pet_tutores enable row level security;
alter table public.contatos_emergencia enable row level security;
alter table public.vacinas enable row level security;
alter table public.historico_medico enable row level security;
alter table public.notificacoes enable row level security;

-- Permissões explícitas para a Data API (PostgREST)
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.usuarios to authenticated;
grant select, insert, update, delete on public.pets to authenticated;
grant select, insert, update, delete on public.ficha_medica to authenticated;
grant select, insert, update, delete on public.medalhas to authenticated;
grant select on public.leituras to authenticated;
grant insert on public.leituras to anon, authenticated;

-- =====================================================
-- E) STORAGE: bucket de fotos e vídeos dos pets
-- =====================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('pets-midia', 'pets-midia', true, 52428800)
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit;

drop policy if exists "leitura publica de midia dos pets" on storage.objects;
create policy "leitura publica de midia dos pets" on storage.objects
  for select to public
  using (bucket_id = 'pets-midia');

drop policy if exists "tutor envia midia na propria pasta" on storage.objects;
create policy "tutor envia midia na propria pasta" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'pets-midia'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "tutor atualiza midia na propria pasta" on storage.objects;
create policy "tutor atualiza midia na propria pasta" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'pets-midia'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'pets-midia'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "tutor apaga midia na propria pasta" on storage.objects;
create policy "tutor apaga midia na propria pasta" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'pets-midia'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
