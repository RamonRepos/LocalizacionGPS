const path = require('node:path');
const express = require('express');

const raizPublico = path.join(__dirname, '..', '..', 'publico');

const enrutadorPaginas = express.Router();

enrutadorPaginas.get('/', (peticion, respuesta) => {
  respuesta.sendFile(path.join(raizPublico, 'paginas', 'index.html'));
});

enrutadorPaginas.get('/compartir/:codigo', (peticion, respuesta) => {
  respuesta.sendFile(path.join(raizPublico, 'paginas', 'compartir.html'));
});

module.exports = { enrutadorPaginas };
