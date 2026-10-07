const express = require('express');

function crearEnrutadorPaginas(assets) {
  const enrutadorPaginas = express.Router();

  async function servirAsset(rutaAsset, respuesta) {
    const recurso = await assets.fetch(new Request(`https://assets${rutaAsset}`));
    respuesta.status(recurso.status);
    const tipoContenido = recurso.headers.get('content-type');
    if (tipoContenido) {
      respuesta.type(tipoContenido);
    }
    respuesta.send(Buffer.from(await recurso.arrayBuffer()));
  }

  enrutadorPaginas.get('/', (peticion, respuesta) => servirAsset('/paginas/index.html', respuesta));

  enrutadorPaginas.get('/compartir/:codigo', (peticion, respuesta) =>
    servirAsset('/paginas/compartir.html', respuesta)
  );

  return enrutadorPaginas;
}

module.exports = { crearEnrutadorPaginas };
