LOCALIZACIONGPS
================

Etiquetas QR imprimibles para recuperar mascotas y objetos perdidos.

Generas un código QR, lo descargas como imagen (PNG) o PDF, lo imprimes y lo
colocas en el collar de tu perro o en un objeto. Si alguien lo encuentra,
escanea el QR con la cámara del móvil y una página le pregunta si quiere
compartir su ubicación. Al aceptar, tú ves esa ubicación (con fecha y hora y
un mensaje opcional) en la página inicial de la web.


FUNCIONALIDADES
---------------

1. Cuentas de usuario
   - Registro e inicio de sesión con email y contraseña (mínimo 8 caracteres).
   - Las contraseñas se guardan hasheadas con scrypt; nunca en texto plano.
   - La sesión dura 7 días mediante cookie httpOnly.

2. Generación de etiquetas QR
   - Página inicial: formulario para crear una etiqueta con nombre opcional
     (p. ej. "Collar de Rocky").
   - El QR se genera en el servidor y se muestra al instante.
   - Cada QR apunta a la dirección pública /compartir/<código> de esta web.
   - Descarga como PNG o como PDF (el PDF incluye el nombre de la etiqueta,
     un texto de ayuda y el enlace, pensado para imprimir).
   - Listado "Mis etiquetas" con las que has creado y su fecha.

3. Compartir ubicación (página pública, sin iniciar sesión)
   - Quien escanea el QR llega a /compartir/<código>.
   - Un botón grande pide permiso al navegador para usar el GPS.
   - Envía latitud, longitud, precisión en metros y un mensaje opcional de
     hasta 500 caracteres.
   - Confirmación visual tras el envío.
   - Límite anti abuso: 10 envíos por etiqueta y hora desde la misma IP.

4. Lista de ubicaciones compartidas
   - En la página inicial, sección "Ubicaciones compartidas conmigo".
   - Muestra fecha/hora, etiqueta implicada, coordenadas, precisión y mensaje.
   - Cada fila incluye un enlace para abrir la ubicación en OpenStreetMap.
   - Se actualiza automáticamente cada 30 segundos (o con el botón Actualizar).


CÓMO EJECUTARLA
---------------

Requisitos: Node.js 22.5 o superior (usa node:sqlite, sin base de datos externa).

  1) npm install
  2) cp .env.example .env      y genera un SESSION_SECRET aleatorio:
       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  3) npm run inicio            → http://localhost:3000
     (npm run dev arranca con recarga automática)

La base de datos SQLite se crea sola en datos/localizacion.db al arrancar.


ENDPOINTS PRINCIPALES
---------------------

Páginas:
  GET  /                              Inicio (login/registro, generador y lista)
  GET  /compartir/:codigo             Página pública para compartir ubicación

API autenticada:
  POST   /api/registro                { email, contrasena }
  POST   /api/login                   { email, contrasena }
  POST   /api/logout
  GET    /api/sesion                  Estado de la sesión actual
  POST   /api/codigos                 { nombre_etiqueta } → crea una etiqueta
  GET    /api/codigos                 Lista mis etiquetas
  GET    /api/codigos/:codigo/ubicaciones   Ubicaciones de una etiqueta concreta
  GET    /api/ubicaciones             Todas las ubicaciones recibidas

Público:
  GET    /qr/:codigo/png              Imagen PNG del QR (?descarga=1 fuerza descarga)
  GET    /qr/:codigo/pdf              PDF imprimible del QR
  POST   /api/compartir/:codigo       { latitud, longitud, precision_metros?, mensaje? }


ESTRUCTURA DEL PROYECTO
-----------------------

  servidor.js               Punto de entrada Express
  src/db.js                 Conexión SQLite y esquema
  src/rutas/                autenticacion.js, codigos.js, ubicaciones.js, paginas.js
  src/servicios/            qr.js (PNG/PDF), usuarios.js (hash scrypt)
  publico/paginas/          index.html, compartir.html
  publico/js/               principal.js, compartir.js
  publico/css/estilos.css   Estilos comunes
  mermaid.txt               Diagrama de clases del proyecto


LIMITACIONES Y NOTAS
--------------------

- La API de geolocalización del navegador solo funciona sobre HTTPS (o en
  localhost). Para producción necesitas servir la web con HTTPS.
- Detrás de un proxy inverso, configura app.set('trust proxy', ...) para que
  los QR usen el esquema correcto.
- El límite de envíos se guarda en memoria: se reinicia al reiniciar el servidor.
- Las sesiones están en memoria (express-session por defecto): al reiniciar el
  servidor, los usuarios tendrán que volver a iniciar sesión.
- No hay borrado ni desactivación de etiquetas todavía (mejora futura útil si
  pierdes una etiqueta impresa).
