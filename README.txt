LOCALIZACIONGPS
================

Etiquetas QR imprimibles para recuperar mascotas y objetos perdidos.

Generas un código QR, lo descargas como imagen (PNG) o PDF, lo imprimes y lo
colocas en el collar de tu perro o en un objeto. Si alguien lo encuentra,
escanea el QR con la cámara del móvil y una página le pregunta si quiere
compartir su ubicación. Al aceptar, tú ves esa ubicación (con fecha y hora y
un mensaje opcional) en la página inicial de la web.

La aplicación está desplegada como Worker de Cloudflare Workers: Express como
capa HTTP, D1 (SQLite gestionado) como base de datos y Cloudflare Assets para
los ficheros estáticos.


FUNCIONALIDADES
---------------

1. Cuentas de usuario
   - Registro e inicio de sesión con email y contraseña (mínimo 8 caracteres).
   - Las contraseñas se guardan hasheadas con scrypt; nunca en texto plano.
   - La sesión dura 7 días mediante cookie httpOnly firmada con HMAC-SHA256
     (sin estado en el servidor: no se pierde al reiniciar).

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


CÓMO EJECUTARLA EN LOCAL
-------------------------

Requisitos: Node.js 18 o superior y npm.

  1) npm install
  2) cp .dev.vars.example .dev.vars    y genera un SESSION_SECRET aleatorio:
       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  3) npm run db:local                  crea las tablas en la D1 local
  4) npm run dev                       → http://localhost:8787

El desarrollo local usa wrangler dev con una base de datos D1 local
(guardada en .wrangler/state, ya ignorada por git).


DESPLIEGUE EN CLOUDFLARE
------------------------

  1) npx wrangler login
  2) npx wrangler d1 create localizacion-db
     Responde "Y" para que wrangler añada el binding a wrangler.jsonc; si no,
     copia a mano el database_id que devuelve el comando.
  3) npm run db:remoto                 crea las tablas en la D1 de producción
  4) npx wrangler secret put SESSION_SECRET
     (genera el valor igual que en el paso 2 de ejecución local)
  5) npm run desplegar

Tras el primer despliegue puedes abrir la URL que imprime wrangler
(https://localizaciongps.<tu-subdominio>.workers.dev).


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

  wrangler.jsonc          Configuración de Cloudflare (Worker, assets, D1)
  esquema.sql             Esquema de tablas para D1
  src/worker.js           Punto de entrada del Worker (bindings, escucha)
  src/aplicacion.js       Fábrica de la aplicación Express
  src/db.js               Adaptador asíncrono sobre la API de D1
  src/rutas/              autenticacion.js, codigos.js, ubicaciones.js, paginas.js
  src/servicios/          sesion.js (cookie firmada), qr.js (PNG/PDF),
                          usuarios.js (hash scrypt)
  publico/paginas/        index.html, compartir.html
  publico/js/             principal.js, compartir.js
  publico/css/estilos.css Estilos comunes
  mermaid.txt             Diagrama de clases del proyecto


CÓMO FUNCIONA SOBRE CLOUDFLARE
------------------------------

- Los estáticos de publico/ los sirve Cloudflare Assets directamente (binding
  ASSETS); Express solo se encarga de las dos páginas dinámicas (/ y
  /compartir/:codigo), que se sirven desde el propio Assets.
- La base de datos es D1: todas las consultas son asíncronas y pasan por el
  adaptador de src/db.js.
- La sesión vive en una cookie firmada (src/servicios/sesion.js): no hay
  estado en el servidor, por lo que funciona con cualquier número de réplicas.
- El generador de PDF usa pdf-lib (compatible con Workers); el PDF anterior
  con pdfkit se sustituyó porque pdfkit necesita ficheros .afm en disco.


LIMITACIONES Y NOTAS
--------------------

- La API de geolocalización del navegador solo funciona sobre HTTPS (o en
  localhost). En despliegue, Cloudflare sirve HTTPS por defecto.
- El límite de envíos anti abuso se guarda en memoria del Worker: cada
  reinicio o aislamiento nuevo lo pone a cero, y no es compartido entre
  réplicas. Es una barrera disuasoria, no un control exacto.
- Si cambias SESSION_SECRET (o usas el secreto aleatorio de emergencia),
  todas las sesiones abiertas quedan invalidadas.
- No hay borrado ni desactivación de etiquetas todavía (mejora futura útil si
  pierdes una etiqueta impresa).
- La base de datos local antigua (datos/localizacion.db, SQLite con
  node:sqlite) quedó obsoleta al migrar a D1; no se migra automáticamente.
