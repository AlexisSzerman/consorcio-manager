-- ============================================================
-- ConsorcioManager - Schema de Supabase
-- Ejecutar en el SQL Editor de tu proyecto de Supabase
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Catálogos base ----------

create table if not exists servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  link text,
  created_at timestamptz not null default now()
);

create table if not exists proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  mail text,
  nota text,
  created_at timestamptz not null default now()
);

-- ---------- Consorcios ----------

create table if not exists consorcios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  direccion text,
  banco text,
  notas text,
  created_at timestamptz not null default now()
);

-- Relación N:N consorcio <-> servicios habilitados
create table if not exists consorcio_servicios (
  consorcio_id uuid not null references consorcios(id) on delete cascade,
  servicio_id uuid not null references servicios(id) on delete cascade,
  primary key (consorcio_id, servicio_id)
);

-- Relación N:N consorcio <-> proveedores mensuales
create table if not exists consorcio_proveedores (
  consorcio_id uuid not null references consorcios(id) on delete cascade,
  proveedor_id uuid not null references proveedores(id) on delete cascade,
  primary key (consorcio_id, proveedor_id)
);

-- ---------- Movimientos (vencimientos / facturas) ----------

create table if not exists movimientos (
  id uuid primary key default gen_random_uuid(),
  consorcio_id uuid references consorcios(id) on delete cascade,
  item_nombre text not null,
  tipo text not null check (tipo in ('servicio', 'proveedor')),
  num_factura text,
  monto numeric(12,2) not null default 0,
  estado text not null default 'PENDIENTE' check (estado in ('PENDIENTE','CARGADA','REVISAR','PAGADO')),
  vencimiento date not null,
  fecha_pago date,
  mail_or_link text,
  notas text,
  estado_actualizado_en timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_movimientos_consorcio on movimientos(consorcio_id);
create index if not exists idx_movimientos_vencimiento on movimientos(vencimiento);
create index if not exists idx_movimientos_estado on movimientos(estado);

-- Trigger: cada vez que cambia el estado de un movimiento, actualiza el timestamp
-- (esto es lo que alimenta el badge global "Actualizado al...")
create or replace function fn_movimiento_estado_actualizado()
returns trigger as $$
begin
  if new.estado is distinct from old.estado then
    new.estado_actualizado_en = now();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_movimiento_estado on movimientos;
create trigger trg_movimiento_estado
  before update on movimientos
  for each row
  execute function fn_movimiento_estado_actualizado();

-- ---------- RLS ----------
-- Habilitado con política abierta para usuarios autenticados.
-- Ajustá esto si vas a tener distintos roles (ej: solo admins pueden borrar).

alter table servicios enable row level security;
alter table proveedores enable row level security;
alter table consorcios enable row level security;
alter table consorcio_servicios enable row level security;
alter table consorcio_proveedores enable row level security;
alter table movimientos enable row level security;

create policy "authenticated_full_access" on servicios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on proveedores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on consorcios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on consorcio_servicios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on consorcio_proveedores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "authenticated_full_access" on movimientos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
