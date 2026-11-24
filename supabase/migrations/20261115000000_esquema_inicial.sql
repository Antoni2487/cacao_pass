-- =============================================================================
-- CacaoPass · Esquema inicial
-- Ejecutar completo en Supabase > SQL Editor (o con `supabase db push`).
-- Ver docs/02-base-de-datos.md para la explicación de cada tabla.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Utilidades
-- -----------------------------------------------------------------------------

-- Mantiene updated_at al día en cada UPDATE.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 2. Usuarios del panel (extiende auth.users de Supabase)
-- -----------------------------------------------------------------------------

create table public.usuarios (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null,
  rol         text not null default 'operador' check (rol in ('admin', 'operador')),
  created_at  timestamptz not null default now()
);

comment on table public.usuarios is 'Perfil y rol de cada persona que entra al panel interno.';

-- Cuando se crea un usuario en Supabase Auth, se crea su perfil automáticamente.
-- El nombre y el rol se leen de los metadatos ("User Metadata") del usuario.
create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.usuarios (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'rol' = 'admin' then 'admin' else 'operador' end
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_usuario();

-- ¿El usuario de la sesión actual es administrador? Se usa en las políticas RLS.
-- security definer evita que la política de usuarios se llame a sí misma en bucle.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.usuarios where id = (select auth.uid()) and rol = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. Productores y parcelas
-- -----------------------------------------------------------------------------

create table public.productores (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null check (length(trim(nombre)) > 0),
  tipo         text not null check (tipo in ('familia', 'cooperativa', 'asociacion')),
  region       text not null,
  anio_inicio  int check (anio_inicio between 1900 and 2100),
  historia     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger productores_updated_at
  before update on public.productores
  for each row execute function public.tocar_updated_at();

create table public.parcelas (
  id                   uuid primary key default gen_random_uuid(),
  productor_id         uuid not null references public.productores (id) on delete cascade,
  nombre               text not null,
  hectareas            numeric(6, 2) check (hectareas > 0),
  altitud_msnm         int check (altitud_msnm between 0 and 6000),
  latitud              numeric(9, 6) check (latitud between -90 and 90),
  longitud             numeric(9, 6) check (longitud between -180 and 180),
  libre_deforestacion  boolean not null default false,
  created_at           timestamptz not null default now(),
  -- Permite que lotes exija que la parcela pertenezca al mismo productor.
  unique (id, productor_id)
);

create index parcelas_productor_idx on public.parcelas (productor_id);

-- -----------------------------------------------------------------------------
-- 4. Lotes
-- -----------------------------------------------------------------------------

create sequence public.lotes_codigo_seq start 1;

-- Genera códigos tipo LT-26-0001 (LT + año de 2 dígitos + correlativo).
create or replace function public.generar_codigo_lote()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select 'LT-' || to_char(now(), 'YY') || '-'
         || lpad(nextval('public.lotes_codigo_seq')::text, 4, '0');
$$;

create table public.lotes (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique default public.generar_codigo_lote(),
  productor_id    uuid not null references public.productores (id) on delete restrict,
  parcela_id      uuid not null,
  variedad        text not null,
  peso_kg         numeric(10, 2) not null check (peso_kg > 0),
  fecha_cosecha   date not null,
  destino         text not null,
  certificaciones text[] not null default '{}',
  estado          text not null default 'registrado'
                    check (estado in ('registrado', 'en_transito', 'exportado')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- La parcela debe ser del mismo productor del lote.
  foreign key (parcela_id, productor_id)
    references public.parcelas (id, productor_id) on delete restrict
);

create index lotes_productor_idx on public.lotes (productor_id);
create index lotes_parcela_idx on public.lotes (parcela_id);

create trigger lotes_updated_at
  before update on public.lotes
  for each row execute function public.tocar_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Etapas (núcleo de la trazabilidad: cada fila se sella en blockchain)
-- -----------------------------------------------------------------------------

create table public.etapas (
  id              uuid primary key default gen_random_uuid(),
  lote_id         uuid not null references public.lotes (id) on delete restrict,
  tipo            text not null check (tipo in (
                    'cosecha', 'fermentacion_secado', 'acopio', 'planta', 'exportacion')),
  orden           int not null,
  responsable_id  uuid references public.usuarios (id) on delete set null,
  ubicacion       text not null,
  fecha           timestamptz not null,
  datos           jsonb not null default '{}',
  hash            char(64) check (hash ~ '^[0-9a-f]{64}$'),
  tx_hash         text check (tx_hash ~ '^0x[0-9a-f]{64}$'),
  sellado_en      timestamptz,
  created_at      timestamptz not null default now(),
  -- Una sola etapa de cada tipo por lote.
  unique (lote_id, orden),
  -- El orden va amarrado al tipo: cosecha=1 ... exportacion=5.
  check (
    (tipo = 'cosecha' and orden = 1) or
    (tipo = 'fermentacion_secado' and orden = 2) or
    (tipo = 'acopio' and orden = 3) or
    (tipo = 'planta' and orden = 4) or
    (tipo = 'exportacion' and orden = 5)
  )
);

comment on column public.etapas.hash is 'SHA-256 (hex) del JSON canónico de la etapa.';
comment on column public.etapas.tx_hash is 'Transacción de Polygon Amoy que contiene el hash.';
comment on column public.etapas.sellado_en is 'Null = pendiente de confirmar en blockchain.';

create index etapas_responsable_idx on public.etapas (responsable_id);

create table public.evidencias (
  id          uuid primary key default gen_random_uuid(),
  etapa_id    uuid not null references public.etapas (id) on delete cascade,
  url         text not null,
  tipo        text not null check (tipo in ('foto', 'pdf')),
  created_at  timestamptz not null default now()
);

create index evidencias_etapa_idx on public.evidencias (etapa_id);

-- -----------------------------------------------------------------------------
-- 6. Escaneos del QR (estadísticas, opcional)
-- -----------------------------------------------------------------------------

create table public.escaneos (
  id          bigint generated always as identity primary key,
  lote_id     uuid not null references public.lotes (id) on delete cascade,
  pais        text,
  resultado   text not null check (resultado in ('verificado', 'alterado')),
  created_at  timestamptz not null default now()
);

create index escaneos_lote_idx on public.escaneos (lote_id);

-- =============================================================================
-- 7. Seguridad: Row Level Security (RLS)
--
-- Regla general:
--   * anon (visitante sin sesión): NO lee nada directo. La página pública lee
--     desde el servidor con la service role, que solo expone lo necesario.
--   * authenticated (admin u operador): lee todo.
--   * Solo admin crea/edita productores, parcelas y lotes.
--   * Las etapas y los escaneos los escribe el servidor (service role) después
--     de calcular el hash, para que nadie pueda saltarse el sellado.
-- =============================================================================

alter table public.usuarios    enable row level security;
alter table public.productores enable row level security;
alter table public.parcelas    enable row level security;
alter table public.lotes       enable row level security;
alter table public.etapas      enable row level security;
alter table public.evidencias  enable row level security;
alter table public.escaneos    enable row level security;

-- usuarios
create policy "usuarios: lectura con sesión" on public.usuarios
  for select to authenticated using (true);
create policy "usuarios: admin edita" on public.usuarios
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- productores
create policy "productores: lectura con sesión" on public.productores
  for select to authenticated using (true);
create policy "productores: admin crea" on public.productores
  for insert to authenticated with check (public.es_admin());
create policy "productores: admin edita" on public.productores
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "productores: admin elimina" on public.productores
  for delete to authenticated using (public.es_admin());

-- parcelas
create policy "parcelas: lectura con sesión" on public.parcelas
  for select to authenticated using (true);
create policy "parcelas: admin crea" on public.parcelas
  for insert to authenticated with check (public.es_admin());
create policy "parcelas: admin edita" on public.parcelas
  for update to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "parcelas: admin elimina" on public.parcelas
  for delete to authenticated using (public.es_admin());

-- lotes
create policy "lotes: lectura con sesión" on public.lotes
  for select to authenticated using (true);
create policy "lotes: admin crea" on public.lotes
  for insert to authenticated with check (public.es_admin());
create policy "lotes: admin edita" on public.lotes
  for update to authenticated using (public.es_admin()) with check (public.es_admin());

-- etapas: solo lectura para el panel; las escribe la API con service role.
create policy "etapas: lectura con sesión" on public.etapas
  for select to authenticated using (true);

-- evidencias
create policy "evidencias: lectura con sesión" on public.evidencias
  for select to authenticated using (true);
create policy "evidencias: con sesión adjunta" on public.evidencias
  for insert to authenticated with check (true);

-- escaneos: el dashboard los lee; los inserta el servidor.
create policy "escaneos: lectura con sesión" on public.escaneos
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- 8. Storage: bucket de evidencias (fotos y PDF por etapa)
-- Público para lectura, porque las fotos se muestran en el pasaporte del lote.
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('evidencias', 'evidencias', true)
on conflict (id) do nothing;

create policy "evidencias: subir con sesión" on storage.objects
  for insert to authenticated with check (bucket_id = 'evidencias');
