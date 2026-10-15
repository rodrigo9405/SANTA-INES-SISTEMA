-- =====================================================================
-- Centro de Enfermería Santa Inés · Sistema de gestión
-- 01 · Esquema de la base de datos
--
-- Cómo usarlo: en Supabase → SQL Editor → New query, pega TODO este
-- archivo y presiona "Run". Se puede volver a ejecutar sin perder datos.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Administradores
--    Solo los correos de esta tabla pueden ver y cambiar datos.
--    (Agrega el tuyo con el archivo 02_administrador.sql)
-- ---------------------------------------------------------------------
create table if not exists public.administradores (
  email   text primary key,
  nombre  text,
  creado  timestamptz not null default now()
);
alter table public.administradores enable row level security;

create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.administradores a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.es_admin() from public, anon;
grant execute on function public.es_admin() to authenticated;

drop policy if exists "administradores: se ven a sí mismos" on public.administradores;
create policy "administradores: se ven a sí mismos" on public.administradores
  for select to authenticated using (public.es_admin());

-- ---------------------------------------------------------------------
-- 2. Personal de enfermería
-- ---------------------------------------------------------------------
create table if not exists public.personal (
  id             uuid primary key default gen_random_uuid(),
  nombres        text not null,
  apellidos      text not null,
  tipo_doc       text not null default 'DNI',   -- DNI, CI (cédula), CE, CPP, PAS
  num_doc        text not null,
  nacionalidad   text,
  fecha_nac      date,
  telefono       text,
  email          text,
  direccion      text,
  distrito       text,
  referencia     text,
  emerg_nombre   text,
  emerg_tel      text,
  categoria      text not null default 'tec' check (categoria in ('lic','tec','aux')),
  cep            text,                          -- colegiatura (licenciados)
  fecha_ingreso  date,
  estado         text not null default 'activo' check (estado in ('activo','inactivo')),
  turnos         text[] not null default '{}',  -- manana, tarde, dia, noche, h24
  dias           smallint[] not null default '{}', -- 0=domingo … 6=sábado
  especiales     boolean not null default false,
  disp_notas     text,
  diagnosticos   text[] not null default '{}',
  experiencia    jsonb not null default '[]'::jsonb, -- clínicas y familias
  documentos     jsonb not null default '[]'::jsonb, -- CV, diplomas… (rutas en Storage)
  notas          text,
  ejemplo        boolean not null default false,
  creado         timestamptz not null default now(),
  actualizado    timestamptz not null default now()
);
create unique index if not exists personal_documento_uq on public.personal (tipo_doc, upper(num_doc));

-- ---------------------------------------------------------------------
-- 3. Clientes
-- ---------------------------------------------------------------------
create table if not exists public.clientes (
  id               uuid primary key default gen_random_uuid(),
  nombres          text not null,
  apellidos        text not null,
  tipo_doc         text not null default 'DNI',
  num_doc          text not null,
  fecha_nac        date,
  telefono         text,
  email            text,
  direccion        text,
  distrito         text,
  referencia       text,
  condicion        text,
  resp_nombre      text,
  resp_parentesco  text,
  resp_tel         text,
  documentos       jsonb not null default '[]'::jsonb,
  notas            text,
  ejemplo          boolean not null default false,
  creado           timestamptz not null default now(),
  actualizado      timestamptz not null default now()
);
create unique index if not exists clientes_documento_uq on public.clientes (tipo_doc, upper(num_doc));

-- ---------------------------------------------------------------------
-- 4. Servicios (especiales y turnos estables)
-- ---------------------------------------------------------------------
create table if not exists public.servicios (
  id            uuid primary key default gen_random_uuid(),
  codigo        text not null unique,                 -- SI-2026-0001
  tipo          text not null check (tipo in ('especial','estable')),
  cliente_ids   uuid[] not null default '{}',
  personal_ids  uuid[] not null default '{}',
  direccion     text,
  fecha_inicio  date not null,
  fecha_fin     date,                                  -- obligatoria en especiales
  turno         text not null check (turno in ('manana','tarde','dia','noche','h24')),
  dias          smallint[] not null default '{}',     -- solo turnos estables
  indicaciones  text,
  estado        text not null default 'vigente' check (estado in ('vigente','cancelado')),
  cierre        jsonb,                                 -- {fecha, huboIncidente, observaciones}
  extensiones   jsonb not null default '[]'::jsonb,   -- historial de extensiones
  ejemplo       boolean not null default false,
  creado        timestamptz not null default now(),
  actualizado   timestamptz not null default now(),
  constraint servicios_fechas_ck check (fecha_fin is null or fecha_fin >= fecha_inicio),
  constraint servicios_especial_fin_ck check (tipo <> 'especial' or fecha_fin is not null)
);
create index if not exists servicios_personal_idx on public.servicios using gin (personal_ids);
create index if not exists servicios_clientes_idx on public.servicios using gin (cliente_ids);

-- ---------------------------------------------------------------------
-- 5. Incidentes (se registran al finalizar o durante el servicio)
-- ---------------------------------------------------------------------
create table if not exists public.incidentes (
  id            uuid primary key default gen_random_uuid(),
  servicio_id   uuid references public.servicios(id) on delete cascade,
  fecha         date not null,
  gravedad      text not null default 'leve' check (gravedad in ('leve','moderada','grave')),
  motivo        text not null,
  causa         text,
  descripcion   text,
  acciones      text,
  personal_ids  uuid[] not null default '{}',
  cliente_ids   uuid[] not null default '{}',
  evidencias    jsonb not null default '[]'::jsonb,   -- fotos, PDF… (rutas en Storage)
  ejemplo       boolean not null default false,
  creado        timestamptz not null default now(),
  actualizado   timestamptz not null default now()
);
create index if not exists incidentes_servicio_idx on public.incidentes (servicio_id);
create index if not exists incidentes_personal_idx on public.incidentes using gin (personal_ids);
create index if not exists incidentes_clientes_idx on public.incidentes using gin (cliente_ids);

-- ---------------------------------------------------------------------
-- 6. Fecha de última modificación automática
-- ---------------------------------------------------------------------
create or replace function public.tocar_actualizado()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.actualizado := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['personal','clientes','servicios','incidentes'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_actualizado', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.tocar_actualizado()', t || '_actualizado', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 7. Seguridad: solo administradores leen y escriben
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['personal','clientes','servicios','incidentes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "solo administradores" on public.%I', t);
    execute format('create policy "solo administradores" on public.%I for all to authenticated using (public.es_admin()) with check (public.es_admin())', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 8. Cambios en vivo (si dos administradores usan el sistema a la vez)
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['personal','clientes','servicios','incidentes'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null;  -- ya estaba agregada o no existe la publicación
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 9. Archivos (CV, diplomas, documentos de clientes, evidencias)
--    Depósito privado: solo administradores; máximo 25 MB por archivo.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('archivos', 'archivos', false, 26214400)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists "archivos: administradores leen" on storage.objects;
create policy "archivos: administradores leen" on storage.objects
  for select to authenticated using (bucket_id = 'archivos' and public.es_admin());

drop policy if exists "archivos: administradores suben" on storage.objects;
create policy "archivos: administradores suben" on storage.objects
  for insert to authenticated with check (bucket_id = 'archivos' and public.es_admin());

drop policy if exists "archivos: administradores modifican" on storage.objects;
create policy "archivos: administradores modifican" on storage.objects
  for update to authenticated using (bucket_id = 'archivos' and public.es_admin()) with check (bucket_id = 'archivos' and public.es_admin());

drop policy if exists "archivos: administradores borran" on storage.objects;
create policy "archivos: administradores borran" on storage.objects
  for delete to authenticated using (bucket_id = 'archivos' and public.es_admin());
