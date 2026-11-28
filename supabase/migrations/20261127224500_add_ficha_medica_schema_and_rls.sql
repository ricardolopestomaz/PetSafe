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

do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_ficha_medica_atualizado_em'
      and tgrelid = 'public.ficha_medica'::regclass
  ) then
    create trigger trg_ficha_medica_atualizado_em
      before update on public.ficha_medica
      for each row execute function public.set_atualizado_em();
  end if;
end $$;

alter table public.ficha_medica enable row level security;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'ficha_medica'
      and policyname = 'tutor gerencia ficha medica dos seus pets'
  ) then
    alter policy "tutor gerencia ficha medica dos seus pets" on public.ficha_medica
      to authenticated
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
  else
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
  end if;
end $$;

grant select, insert, update, delete on public.ficha_medica to authenticated;
