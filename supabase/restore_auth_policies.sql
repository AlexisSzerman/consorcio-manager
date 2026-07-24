-- ============================================================
-- Revierte el acceso abierto a "anon" y vuelve a exigir login
-- (rol "authenticated") ahora que la app tiene Supabase Auth.
--
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de crear tu
-- usuario en Authentication > Users.
-- ============================================================

-- 1) Sacarle los privilegios de tabla a anon
revoke select, insert, update, delete on servicios from anon;
revoke select, insert, update, delete on proveedores from anon;
revoke select, insert, update, delete on consorcios from anon;
revoke select, insert, update, delete on consorcio_servicios from anon;
revoke select, insert, update, delete on consorcio_proveedores from anon;
revoke select, insert, update, delete on movimientos from anon;

-- 2) Dárselos a authenticated
grant select, insert, update, delete on servicios to authenticated;
grant select, insert, update, delete on proveedores to authenticated;
grant select, insert, update, delete on consorcios to authenticated;
grant select, insert, update, delete on consorcio_servicios to authenticated;
grant select, insert, update, delete on consorcio_proveedores to authenticated;
grant select, insert, update, delete on movimientos to authenticated;

-- 3) Reemplazar las políticas "anon_full_access" por unas que exigen login
drop policy if exists "anon_full_access" on servicios;
create policy "authenticated_full_access" on servicios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "anon_full_access" on proveedores;
create policy "authenticated_full_access" on proveedores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "anon_full_access" on consorcios;
create policy "authenticated_full_access" on consorcios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "anon_full_access" on consorcio_servicios;
create policy "authenticated_full_access" on consorcio_servicios
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "anon_full_access" on consorcio_proveedores;
create policy "authenticated_full_access" on consorcio_proveedores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "anon_full_access" on movimientos;
create policy "authenticated_full_access" on movimientos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
