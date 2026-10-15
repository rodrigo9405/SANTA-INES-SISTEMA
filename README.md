# Santa Inés · Sistema de gestión

Sistema web del **Centro de Enfermería Santa Inés** para administrar personal de enfermería, clientes, servicios e incidentes. Funciona en computadora y celular. Los datos, el ingreso y los archivos se guardan en **Supabase**.

## Qué hace

- **Ingreso de administrador** con correo y contraseña. Solo los correos autorizados ven y cambian datos.
- **Personal de enfermería**:
  - Datos generales y documento (DNI, cédula de identidad, carné de extranjería, PTP/CPP o pasaporte).
  - Dirección y contacto de emergencia.
  - Turnos y días que prefiere, y si hace especiales.
  - Diagnósticos que atendió.
  - Clínicas y familias donde trabajó, con sus contactos.
  - Documentos: CV, diplomas, colegiatura, antecedentes.
- **Clientes**: documento, nombre, dirección, condición del paciente, familiar responsable y documentos.
- **Servicios**:
  - *Especiales*, con fecha de término, o *turnos estables*, por días de la semana.
  - Uno o varios clientes y una o varias personas del personal.
  - Al asignar personal, la lista se ordena así: primero quienes están libres y tienen la preferencia (hacen especiales o prefieren ese turno), luego los demás libres, y al final los **ocupados** en esas fechas y horario.
- **Cierre de servicios**: cuando un especial llega a su fecha de término, queda "Por cerrar" hasta que se **extiende** o se **finaliza**.
- **Incidentes**:
  - Al finalizar se indica si hubo incidentes, con motivo, causa, qué pasó, acciones tomadas y evidencias (fotos, PDF, Word, videos).
  - Los incidentes aparecen en la ficha del personal y del cliente.
- **Búsqueda e historial**:
  - Personal: por DNI, cédula, nombre, apellido o servicio.
  - Clientes: por DNI, nombre o apellido.
  - Cada ficha muestra su historial de servicios.
- **Inicio**:
  - Totales de personal (en servicio, libre, inactivo), clientes, servicios activos e incidentes.
  - Gráfico de servicios por semana, mes o año.
  - Lista de quién está de turno hoy y agenda de 14 días.
- Todo se puede **editar y eliminar**.

---

## Instalación (una sola vez)

### 1. Crear las tablas en Supabase
> ✅ Ya está hecho en el proyecto `SUPABASE-SANTA-INES-SISTEMA`. Solo repítelo si creas otro proyecto.

1. Entra a tu proyecto en [supabase.com](https://supabase.com).
2. Abre **SQL Editor → New query**.
3. Copia todo el contenido de [`supabase/01_esquema.sql`](supabase/01_esquema.sql), pégalo y presiona **Run**.

Esto crea:
- Las tablas.
- Las reglas de seguridad (solo los administradores leen y escriben).
- El depósito privado de archivos `archivos`, con un máximo de 25 MB por archivo.
- Las actualizaciones en vivo.

Si lo vuelves a ejecutar, no se pierden datos.

### 2. Crear al administrador
1. En Supabase ve a **Authentication → Users → Add user → Create new user**.
2. Escribe el correo y la contraseña, y marca **Auto Confirm User**.
3. Abre [`supabase/02_administrador.sql`](supabase/02_administrador.sql) y reemplaza `CORREO-DEL-ADMINISTRADOR@ejemplo.com` por ese correo. Pon también el nombre de la persona: es el que aparece en el saludo.
4. Ejecútalo en el **SQL Editor**.

Repite el paso 2 por cada administrador.

### 3. (Opcional) Cargar datos de ejemplo
Para probar el sistema, ejecuta [`supabase/03_datos_ejemplo.sql`](supabase/03_datos_ejemplo.sql). Los registros quedan marcados como "Ejemplo" y se borran con el botón **Borrar datos de ejemplo** en Inicio.

### 4. Cerrar los registros públicos
En **Authentication → Sign In / Providers → Email**, desactiva **Allow new users to sign up**. Así nadie puede crearse una cuenta por su cuenta. Aunque alguien lo hiciera, no vería ningún dato si su correo no está en la tabla `administradores`.

### 5. Conectar el sistema con tu proyecto
> ✅ Ya está hecho: `js/config.js` apunta a `SUPABASE-SANTA-INES-SISTEMA`. Solo cámbialo si usas otro proyecto.

1. En Supabase abre **Project Settings → API Keys** (o **Data API**).
2. Copia la **Project URL** y la **clave pública**. La clave pública se llama "anon public" o "publishable key".
3. En GitHub abre [`js/config.js`](js/config.js), toca el lápiz para editar, pega los dos valores y guarda con **Commit changes**:

```js
window.SANTA_INES_CONFIG = {
  supabaseUrl: 'https://xxxxxxxx.supabase.co',
  supabaseAnonKey: 'tu-clave-publica',
};
```

> ⚠️ Nunca pongas la clave **service_role** ni la **secret key**. La clave pública sí puede ir en el código, porque las reglas de seguridad de la base de datos protegen la información.

### 6. Publicar el sistema en internet
El sistema son archivos estáticos (HTML, CSS y JS). No necesita compilarse. Puedes publicarlo gratis desde este repositorio privado con **Netlify**, **Vercel** o **Cloudflare Pages**. Con Netlify:
1. Entra a Netlify con tu cuenta de GitHub.
2. Elige **Add new site → Import an existing project → GitHub → SANTA-INES-SISTEMA**.
3. Deja vacío el comando de compilación (build command) y usa la carpeta raíz como carpeta de publicación.
4. Presiona **Deploy**.

Cada vez que cambies algo en GitHub, el sitio se actualiza solo.

### 7. Configurar el enlace de recuperación de contraseña
En Supabase ve a **Authentication → URL Configuration** y pon la dirección de tu sitio publicado (por ejemplo `https://santa-ines.netlify.app`) en **Site URL** y en **Redirect URLs**. Así funciona el enlace de "¿Olvidaste tu contraseña?".

---

## Probarlo en tu computadora
Abre una terminal en la carpeta del proyecto y ejecuta `python3 -m http.server 8080`. Luego entra a `http://localhost:8080`. Agrega `http://localhost:8080` en **Redirect URLs** si quieres probar la recuperación de contraseña.

## Estructura

```
index.html                 Página principal
css/estilos.css            Estilos (colores del logo, modo claro y oscuro)
js/config.js               Dirección y clave pública de Supabase
js/app.js                  Lógica del sistema
img/logo.png, icono.png    Logo de Santa Inés
supabase/01_esquema.sql    Tablas, seguridad y archivos
supabase/02_administrador.sql
supabase/03_datos_ejemplo.sql
```

## Cómo decide si alguien está ocupado
Cada turno ocupa bloques del día:

| Turno | Bloques |
|---|---|
| Mañana (07–13 h) | M |
| Tarde (13–19 h) | T |
| Día 12 h (07–19 h) | M y T |
| Noche 12 h (19–07 h) | N |
| 24 horas | M, T y N |

Una persona está **ocupada** para un servicio nuevo si ya tiene otro servicio que coincide en **al menos un día y un bloque**. Por ejemplo, alguien con un especial de día del 18 al 20 de octubre aparece ocupado para otro especial en esas fechas. En cambio, sí puede tomar un turno de noche esos mismos días. Los servicios cancelados o ya finalizados liberan al personal.

## Límites del plan gratuito de Supabase
- 500 MB de base de datos y 1 GB de archivos.
- Si el proyecto pasa una semana sin uso, Supabase lo pausa. Se reactiva desde el panel.
