-- =====================================================================
-- 03 · Datos de ejemplo (OPCIONAL)
--
-- Carga personal, clientes, servicios e incidentes ficticios, marcados
-- como "Ejemplo", con fechas alrededor del día en que lo ejecutes.
-- Sirven para probar el panel, la disponibilidad y los historiales.
--
-- Para borrarlos: botón "Borrar datos de ejemplo" en la pantalla de
-- Inicio, o el bloque comentado al final de este archivo.
-- =====================================================================

insert into public.personal (id, nombres, apellidos, tipo_doc, num_doc, nacionalidad, fecha_nac, telefono, direccion, distrito, categoria, cep, fecha_ingreso, estado, turnos, dias, especiales, diagnosticos, experiencia, ejemplo) values
('a0000000-0000-4000-8000-000000000001','María Fernanda','Quispe Huamán','DNI','45872136','Peruana','1989-04-12','987 451 236','Av. Caminos del Inca 1280','Santiago de Surco','lic','078452', current_date - 900,'activo','{dia,h24}','{}',true,
  '{"Post operatorio","Fractura de cadera","Alzheimer","Úlceras por presión"}',
  '[{"tipo":"Clínica","nombre":"Clínica Los Álamos (ejemplo)","contacto":"Jefa de enfermería","telefono":"01 555 0101","desde":"2015","hasta":"2021","paciente":"Hospitalización y post operatorio"},{"tipo":"Familia (domicilio)","nombre":"Familia Rivas","contacto":"Sra. Rivas","telefono":"999 000 111","desde":"2022","hasta":"2023","paciente":"Paciente con Alzheimer"}]', true),
('a0000000-0000-4000-8000-000000000002','Rosa Elvira','Mamani Condori','DNI','41236587','Peruana','1983-09-02','965 874 120','Jr. Huáscar 455','Jesús María','tec',null, current_date - 1400,'activo','{noche}','{}',true,
  '{"Paciente postrado","Sonda nasogástrica","Diabetes"}', '[]', true),
('a0000000-0000-4000-8000-000000000003','Carlos Alberto','Huerta Ríos','DNI','70125489','Peruana','1995-01-20','944 125 780','Calle Las Palmeras 120','Los Olivos','tec',null, current_date - 400,'activo','{manana,tarde}','{1,2,3,4,5}',false,
  '{"Pie diabético","Hipertensión arterial"}', '[]', true),
('a0000000-0000-4000-8000-000000000004','Yuleisy Andreína','Pérez Montilla','CE','001457823','Venezolana','1992-07-30','912 336 445','Av. Brasil 2150','Pueblo Libre','tec',null, current_date - 600,'activo','{dia}','{}',true,
  '{"Puérpera y recién nacido","Oxigenoterapia"}', '[]', true),
('a0000000-0000-4000-8000-000000000005','Lucía Teresa','Salazar Vega','DNI','46598712','Peruana','1990-11-15','998 552 014','Av. Javier Prado Este 3400','San Borja','lic','091237', current_date - 1100,'activo','{tarde,noche}','{}',false,
  '{"Paciente oncológico","Cuidados paliativos","EPOC"}', '[]', true),
('a0000000-0000-4000-8000-000000000006','Jorge Luis','Paredes Chávez','DNI','43781256','Peruana','1986-03-08','955 410 963','Jr. Ica 330','Cercado de Lima','tec',null, current_date - 2000,'activo','{h24,noche}','{}',true,
  '{"Secuela de ACV","Traqueostomía","Paciente postrado"}', '[]', true)
on conflict (id) do nothing;

insert into public.clientes (id, nombres, apellidos, tipo_doc, num_doc, fecha_nac, telefono, direccion, distrito, referencia, condicion, resp_nombre, resp_parentesco, resp_tel, ejemplo) values
('b0000000-0000-4000-8000-000000000001','Elena Rosario','Gutiérrez de Vargas','DNI','07845123','1941-06-18','01 448 2210','Av. Primavera 1450, dpto. 302','Santiago de Surco','Frente al parque Los Cedros','Post operatorio de cadera; usa andador','Ricardo Vargas','Hijo','987 654 321', true),
('b0000000-0000-4000-8000-000000000002','Manuel Augusto','Torres Linares','DNI','06512378','1938-02-03','01 462 7780','Jr. Cusco 245','Magdalena del Mar',null,'Alzheimer moderado','Patricia Torres','Hija','976 112 334', true),
('b0000000-0000-4000-8000-000000000003','Carmen Julia','Ñique Salas','DNI','09987412','1950-10-27','01 349 0012','Calle Los Pinos 180','La Molina',null,'Diabetes tipo 2; curación de pie diabético','Luis Ñique','Esposo','945 778 210', true),
('b0000000-0000-4000-8000-000000000004','Ana Lucía','Delgado Ríos','DNI','10458796','1948-12-09','01 241 5530','Calle Alcanfores 812','Miraflores',null,'Paciente oncológica en cuidados paliativos','Martín Delgado','Hijo','991 220 845', true)
on conflict (id) do nothing;

insert into public.servicios (id, codigo, tipo, cliente_ids, personal_ids, direccion, fecha_inicio, fecha_fin, turno, dias, indicaciones, estado, cierre, extensiones, ejemplo) values
('c0000000-0000-4000-8000-000000000001','SI-EJ-0001','especial','{b0000000-0000-4000-8000-000000000001}','{a0000000-0000-4000-8000-000000000001}','Av. Primavera 1450, dpto. 302, Santiago de Surco', current_date - 3, current_date + 6,'dia','{}','Movilización asistida cada 2 horas. Control de dolor según receta.','vigente',null,'[]', true),
('c0000000-0000-4000-8000-000000000002','SI-EJ-0002','estable','{b0000000-0000-4000-8000-000000000002}','{a0000000-0000-4000-8000-000000000002}','Jr. Cusco 245, Magdalena del Mar', current_date - 75, null,'noche','{1,2,3,4,5}','Acompañamiento nocturno. Evitar que se levante solo.','vigente',null,'[]', true),
('c0000000-0000-4000-8000-000000000003','SI-EJ-0003','especial','{b0000000-0000-4000-8000-000000000003}','{a0000000-0000-4000-8000-000000000004}','Calle Los Pinos 180, La Molina', current_date + 3, current_date + 5,'dia','{}','Curación diaria de pie diabético.','vigente',null,'[]', true),
('c0000000-0000-4000-8000-000000000004','SI-EJ-0004','especial','{b0000000-0000-4000-8000-000000000001}','{a0000000-0000-4000-8000-000000000006}','Av. Primavera 1450, dpto. 302, Santiago de Surco', current_date - 25, current_date - 20,'h24','{}',null,'vigente',
  jsonb_build_object('fecha', (current_date - 20)::text, 'huboIncidente', true, 'observaciones', 'La familia quedó conforme con la atención.', 'registrado', (current_date - 20)::text),'[]', true),
('c0000000-0000-4000-8000-000000000005','SI-EJ-0005','estable','{b0000000-0000-4000-8000-000000000004}','{a0000000-0000-4000-8000-000000000005}','Calle Alcanfores 812, Miraflores', current_date - 106, current_date - 15,'tarde','{1,3,5}',null,'vigente',
  jsonb_build_object('fecha', (current_date - 15)::text, 'huboIncidente', false, 'observaciones', '', 'registrado', (current_date - 15)::text),'[]', true),
('c0000000-0000-4000-8000-000000000006','SI-EJ-0006','especial','{b0000000-0000-4000-8000-000000000003}','{a0000000-0000-4000-8000-000000000003}','Calle Los Pinos 180, La Molina', current_date - 9, current_date - 2,'manana','{}',null,'vigente',null,'[]', true),
('c0000000-0000-4000-8000-000000000007','SI-EJ-0007','especial','{b0000000-0000-4000-8000-000000000002}','{a0000000-0000-4000-8000-000000000001}','Jr. Cusco 245, Magdalena del Mar', current_date - 200, current_date - 195,'dia','{}',null,'vigente',
  jsonb_build_object('fecha', (current_date - 195)::text, 'huboIncidente', false, 'observaciones', '', 'registrado', (current_date - 195)::text),'[]', true),
('c0000000-0000-4000-8000-000000000008','SI-EJ-0008','especial','{b0000000-0000-4000-8000-000000000004}','{a0000000-0000-4000-8000-000000000002}','Calle Alcanfores 812, Miraflores', current_date - 160, current_date - 154,'noche','{}',null,'vigente',
  jsonb_build_object('fecha', (current_date - 154)::text, 'huboIncidente', false, 'observaciones', '', 'registrado', (current_date - 154)::text),'[]', true),
('c0000000-0000-4000-8000-000000000009','SI-EJ-0009','especial','{b0000000-0000-4000-8000-000000000001}','{a0000000-0000-4000-8000-000000000004}','Av. Primavera 1450, dpto. 302, Santiago de Surco', current_date - 115, current_date - 113,'dia','{}',null,'vigente',
  jsonb_build_object('fecha', (current_date - 113)::text, 'huboIncidente', true, 'observaciones', '', 'registrado', (current_date - 113)::text),'[]', true)
on conflict (id) do nothing;

insert into public.incidentes (id, servicio_id, fecha, gravedad, motivo, causa, descripcion, acciones, personal_ids, cliente_ids, evidencias, ejemplo) values
('d0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000004', current_date - 22,'leve','Caída leve de la paciente al ir al baño','Piso húmedo en el baño',
  'La paciente resbaló al levantarse del inodoro. El enfermero la sostuvo y no hubo golpe en la cabeza; quedó un hematoma pequeño en la rodilla.',
  'Se avisó al hijo, se aplicó compresa fría y se colocó un tapete antideslizante.','{a0000000-0000-4000-8000-000000000006}','{b0000000-0000-4000-8000-000000000001}','[]', true),
('d0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000009', current_date - 114,'moderada','Retraso de dos horas en el relevo de turno','Problema de transporte del personal',
  'La técnica llegó a las 09:00 en lugar de las 07:00. La familia cubrió el intervalo.',
  'Se conversó con la técnica y se acordó salir con más anticipación.','{a0000000-0000-4000-8000-000000000004}','{b0000000-0000-4000-8000-000000000001}','[]', true)
on conflict (id) do nothing;

-- Para borrar todos los ejemplos desde aquí:
-- delete from public.incidentes where ejemplo;
-- delete from public.servicios  where ejemplo;
-- delete from public.clientes   where ejemplo;
-- delete from public.personal   where ejemplo;
