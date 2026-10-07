const crypto = require('node:crypto');
const express = require('express');

const { requerirSesion } = require('./autenticacion');
const { generarQrPng, generarQrPdf } = require('../servicios/qr');

function construirUrlPublica(peticion, codigo) {
  return `${peticion.protocol}://${peticion.get('host')}/compartir/${codigo}`;
}

function nuevoIdentificador() {
  return crypto.randomBytes(9).toString('base64url');
}

function crearEnrutadorCodigos(db) {
  const enrutadorCodigos = express.Router();

  async function obtenerCodigoPropio(peticion, codigoId) {
    return db.get(
      'SELECT id, nombre_etiqueta, fecha_creacion FROM codigos WHERE id = ? AND usuario_id = ?',
      codigoId,
      peticion.usuarioSesion
    );
  }

  enrutadorCodigos.post('/codigos', requerirSesion, async (peticion, respuesta) => {
    const nombreEtiqueta = typeof peticion.body?.nombre_etiqueta === 'string'
      ? peticion.body.nombre_etiqueta.trim().slice(0, 100)
      : '';

    const id = nuevoIdentificador();
    await db.run(
      'INSERT INTO codigos (id, usuario_id, nombre_etiqueta, fecha_creacion) VALUES (?, ?, ?, ?)',
      id,
      peticion.usuarioSesion,
      nombreEtiqueta || null,
      new Date().toISOString()
    );

    respuesta.status(201).json({
      id,
      nombre_etiqueta: nombreEtiqueta,
      url: construirUrlPublica(peticion, id)
    });
  });

  enrutadorCodigos.get('/codigos', requerirSesion, async (peticion, respuesta) => {
    const codigos = await db.all(
      'SELECT id, nombre_etiqueta, fecha_creacion FROM codigos WHERE usuario_id = ? ORDER BY fecha_creacion DESC',
      peticion.usuarioSesion
    );

    respuesta.json(codigos.map((codigo) => ({ ...codigo, url: construirUrlPublica(peticion, codigo.id) })));
  });

  enrutadorCodigos.get('/codigos/:codigo/ubicaciones', requerirSesion, async (peticion, respuesta) => {
    const codigo = await obtenerCodigoPropio(peticion, peticion.params.codigo);
    if (!codigo) {
      respuesta.status(404).json({ error: 'Código no encontrado' });
      return;
    }

    const ubicaciones = await db.all(
      `SELECT latitud, longitud, precision_metros, mensaje, fecha_compartida
       FROM ubicaciones WHERE codigo_id = ? ORDER BY fecha_compartida DESC`,
      codigo.id
    );

    respuesta.json(ubicaciones);
  });

  return enrutadorCodigos;
}

function crearEnrutadorQr(db) {
  const enrutadorQr = express.Router();

  async function servirArchivoQr(peticion, respuesta, formato) {
    const { codigo } = peticion.params;
    const existe = await db.get('SELECT nombre_etiqueta FROM codigos WHERE id = ?', codigo);
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
      console.error(error);
      respuesta.status(500).json({ error: 'No se pudo generar el archivo' });
    }
  }

  enrutadorQr.get('/qr/:codigo/png', (peticion, respuesta) => servirArchivoQr(peticion, respuesta, 'png'));
  enrutadorQr.get('/qr/:codigo/pdf', (peticion, respuesta) => servirArchivoQr(peticion, respuesta, 'pdf'));

  return enrutadorQr;
}

module.exports = { crearEnrutadorCodigos, crearEnrutadorQr };
