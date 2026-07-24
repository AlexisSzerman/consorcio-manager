-- ============================================================
-- FIX: la app usa la anon key sin login (Supabase Auth), así que
-- las requests llegan como rol "anon", no "authenticated".
-- Este script le da a "anon" los mismos permisos que antes le
-- dábamos solo a "authenticated".
--
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================

-- 1) Otorgar privilegios a nivel de tabla al rol anon
grant usage on schema public to anon;

grant select, insert, update, delete on servicios to anon;
grant select, insert, update, delete on proveedores to anon;
grant select, insert, update, delete on consorcios to anon;
grant select, insert, update, delete on consorcio_servicios to anon;
grant select, insert, update, delete on consorcio_proveedores to anon;
grant select, insert, update, delete on movimientos to anon;

-- 2) Reemplazar las políticas de RLS para que acepten anon también
drop policy if exists "authenticated_full_access" on servicios;
create policy "anon_full_access" on servicios
  for all using (true) with check (true);

drop policy if exists "authenticated_full_access" on proveedores;
create policy "anon_full_access" on proveedores
  for all using (true) with check (true);

drop policy if exists "authenticated_full_access" on consorcios;
create policy "anon_full_access" on consorcios
  for all using (true) with check (true);

drop policy if exists "authenticated_full_access" on consorcio_servicios;
create policy "anon_full_access" on consorcio_servicios
  for all using (true) with check (true);

drop policy if exists "authenticated_full_access" on consorcio_proveedores;
create policy "anon_full_access" on consorcio_proveedores
  for all using (true) with check (true);

drop policy if exists "authenticated_full_access" on movimientos;
create policy "anon_full_access" on movimientos
  for all using (true) with check (true);
