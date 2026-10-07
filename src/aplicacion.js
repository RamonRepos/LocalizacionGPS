const express = require('express');

const { middlewareSesion } = require('./servicios/sesion');
const { crearEnrutadorAutenticacion } = require('./rutas/autenticacion');
const { crearEnrutadorCodigos, crearEnrutadorQr } = require('./rutas/codigos');
const { crearEnrutadorUbicaciones } = require('./rutas/ubicaciones');
const { crearEnrutadorPaginas } = require('./rutas/paginas');

function crearAplicacion({ db, secretoSesion, assets }) {
  const aplicacion = express();

  aplicacion.disable('x-powered-by');
  aplicacion.set('trust proxy', true);
  aplicacion.use(express.json());
  aplicacion.use(middlewareSesion(secretoSesion));

  aplicacion.use(crearEnrutadorPaginas(assets));
  aplicacion.use('/api', crearEnrutadorAutenticacion(db));
  aplicacion.use('/api', crearEnrutadorCodigos(db));
  aplicacion.use('/api', crearEnrutadorUbicaciones(db));
  aplicacion.use(crearEnrutadorQr(db));

  aplicacion.use((error, peticion, respuesta, siguiente) => {
    console.error(error);
    respuesta.status(500).json({ error: 'Error interno del servidor' });
  });

  return aplicacion;
}

module.exports = { crearAplicacion };
