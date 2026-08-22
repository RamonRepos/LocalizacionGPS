const crypto = require('node:crypto');
const express = require('express');

const { db } = require('../db');
const { requerirSesion } = require('./autenticacion');
const { generarQrPng, generarQrPdf } = require('../servicios/qr');

function construirUrlPublica(peticion, codigo) {
  return `${peticion.protocol}://${peticion.get('host')}/compartir/${codigo}`;
}

function nuevoIdentificador() {
  return crypto.randomBytes(9).toString('base64url');
}

function obtenerCodigoPropio(peticion, codigoId) {
  return db
    .prepare('SELECT id, nombre_etiqueta, fecha_creacion FROM codigos WHERE id = ? AND usuario_id = ?')
    .get(codigoId, peticion.session.usuarioId);
}

const enrutadorCodigos = express.Router();

enrutadorCodigos.post('/codigos', requerirSesion, (peticion, respuesta) => {
  const nombreEtiqueta = typeof peticion.body?.nombre_etiqueta === 'string'
    ? peticion.body.nombre_etiqueta.trim().slice(0, 100)
    : '';

  const id = nuevoIdentificador();
  db.prepare(
    'INSERT INTO codigos (id, usuario_id, nombre_etiqueta, fecha_creacion) VALUES (?, ?, ?, ?)'
  ).run(id, peticion.session.usuarioId, nombreEtiqueta || null, new Date().toISOString());

  respuesta.status(201).json({
    id,
    nombre_etiqueta: nombreEtiqueta,
    url: construirUrlPublica(peticion, id)
  });
});

enrutadorCodigos.get('/codigos', requerirSesion, (peticion, respuesta) => {
  const codigos = db
    .prepare('SELECT id, nombre_etiqueta, fecha_creacion FROM codigos WHERE usuario_id = ? ORDER BY fecha_creacion DESC')
    .all(peticion.session.usuarioId);

  respuesta.json(codigos.map((codigo) => ({ ...codigo, url: construirUrlPublica(peticion, codigo.id) })));
});

enrutadorCodigos.get('/codigos/:codigo/ubicaciones', requerirSesion, (peticion, respuesta) => {
  const codigo = obtenerCodigoPropio(peticion, peticion.params.codigo);
  if (!codigo) {
    respuesta.status(404).json({ error: 'Código no encontrado' });
    return;
  }

  const ubicaciones = db
    .prepare(`SELECT latitud, longitud, precision_metros, mensaje, fecha_compartida
              FROM ubicaciones WHERE codigo_id = ? ORDER BY fecha_compartida DESC`)
    .all(codigo.id);

  respuesta.json(ubicaciones);
});

const enrutadorQr = express.Router();

async function servirArchivoQr(peticion, respuesta, formato) {
  const { codigo } = peticion.params;
  const existe = db.prepare('SELECT nombre_etiqueta FROM codigos WHERE id = ?').get(codigo);
  if (!existe) {
    respuesta.status(404).send('Código no encontrado');
    return;
  }

  const urlDestino = construirUrlPublica(peticion, codigo);

  try {
    if (formato === 'png') {
      const imagen = await generarQrPng(urlDestino);
      respuesta.type('image/png');
      if (peticion.query.descarga === '1') {
        respuesta.setHeader('Content-Disposition', `attachment; filename="qr-${codigo}.png"`);
      }
      respuesta.send(imagen);
      return;
    }

    const pdf = await generarQrPdf(urlDestino, existe.nombre_etiqueta);
    respuesta.type('application/pdf');
    respuesta.setHeader('Content-Disposition', `attachment; filename="qr-${codigo}.pdf"`);
    respuesta.send(pdf);
  } catch (error) {
    respuesta.status(500).json({ error: 'No se pudo generar el archivo' });
  }
}

enrutadorQr.get('/qr/:codigo/png', (peticion, respuesta) => servirArchivoQr(peticion, respuesta, 'png'));
enrutadorQr.get('/qr/:codigo/pdf', (peticion, respuesta) => servirArchivoQr(peticion, respuesta, 'pdf'));

module.exports = { enrutadorCodigos, enrutadorQr };
