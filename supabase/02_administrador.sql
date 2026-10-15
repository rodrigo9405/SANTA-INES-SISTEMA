-- =====================================================================
-- 02 · Autorizar a un administrador
--
-- Antes: crea el usuario en Supabase → Authentication → Users →
-- "Add user" → "Create new user" (correo + contraseña, marca
-- "Auto Confirm User").
--
-- Luego reemplaza el correo de abajo por el de ese usuario y ejecuta
-- este archivo en el SQL Editor. Repite para cada administrador.
-- =====================================================================

insert into public.administradores (email, nombre)
values ('CORREO-DEL-ADMINISTRADOR@ejemplo.com', 'Administrador')
on conflict (email) do update set nombre = excluded.nombre;

-- Para quitarle el acceso a alguien:
-- delete from public.administradores where email = 'correo@ejemplo.com';

-- Para ver quiénes son administradores:
-- select * from public.administradores;
