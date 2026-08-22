const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');

const { enrutadorAutenticacion } = require('./src/rutas/autenticacion');
const { enrutadorCodigos, enrutadorQr } = require('./src/rutas/codigos');
const { enrutadorUbicaciones } = require('./src/rutas/ubicaciones');
const { enrutadorPaginas } = require('./src/rutas/paginas');

try {
  process.loadEnvFile();
} catch {}

const puerto = Number(process.env.PUERTO) || 3000;
const secretoSesion = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const aplicacion = express();

aplicacion.disable('x-powered-by');
aplicacion.use(express.json());
aplicacion.use(
  session({
    secret: secretoSesion,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);
aplicacion.use(express.static(path.join(__dirname, 'publico')));
aplicacion.use(enrutadorPaginas);
aplicacion.use('/api', enrutadorAutenticacion);
aplicacion.use('/api', enrutadorCodigos);
aplicacion.use('/api', enrutadorUbicaciones);
aplicacion.use(enrutadorQr);

aplicacion.use((error, peticion, respuesta, siguiente) => {
  console.error(error);
  respuesta.status(500).json({ error: 'Error interno del servidor' });
});

aplicacion.listen(puerto, () => {
  console.log(`Servidor escuchando en http://localhost:${puerto}`);
});
