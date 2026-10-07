import { env } from 'cloudflare:workers';
import { httpServerHandler } from 'cloudflare:node';

import { crearAplicacion } from './aplicacion.js';
import { crearBaseDatos } from './db.js';

if (!env.DB) {
  throw new Error('Falta el binding DB (base de datos D1). Ejecuta: npx wrangler d1 create localizacion-db');
}
if (!env.ASSETS) {
  throw new Error('Falta el binding ASSETS (archivos estáticos). Revisa la sección "assets" de wrangler.jsonc');
}

if (!env.SESSION_SECRET) {
  console.warn('SESSION_SECRET no está definido: se usará un secreto aleatorio efímero. Configúralo con `npx wrangler secret put SESSION_SECRET` (producción) o en .dev.vars (local).');
}

const aplicacion = crearAplicacion({
  db: crearBaseDatos(env.DB),
  secretoSesion: env.SESSION_SECRET,
  assets: env.ASSETS
});

aplicacion.listen(3000);

export default httpServerHandler({ port: 3000 });
