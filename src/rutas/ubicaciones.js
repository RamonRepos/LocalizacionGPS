const express = require('express');

const { db } = require('../db');
const { requerirSesion } = require('./autenticacion');

const LIMITE_ENVIOS = 10;
const VENTANA_MS = 60 * 60 * 1000;
const registrosPorClave = new Map();

function podarRegistrosAntiguos(ahora) {
  for (const [clave, fechas] of registrosPorClave) {
    const vigentes = fechas.filter((fecha) => ahora - fecha < VENTANA_MS);
    if (vigentes.length === 0) {
      registrosPorClave.delete(clave);
    } else {
      registrosPorClave.set(clave, vigentes);
    }
  }
}

function superaLimite(clave, ahora) {
  const registros = (registrosPorClave.get(clave) ?? []).filter(
    (fecha) => ahora - fecha < VENTANA_MS
  );
  if (registros.length >= LIMITE_ENVIOS) {
    registrosPorClave.set(clave, registros);
    return true;
  }
  registros.push(ahora);
  registrosPorClave.set(clave, registros);
  return false;
}

function coordenadaValida(valor, minimo, maximo) {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= minimo && numero <= maximo;
}

const enrutadorUbicaciones = express.Router();

enrutadorUbicaciones.post('/compartir/:codigo', (peticion, respuesta) => {
  const { codigo } = peticion.params;

  const existe = db.prepare('SELECT id FROM codigos WHERE id = ?').get(codigo);
  if (!existe) {
    respuesta.status(404).json({ error: 'Esta etiqueta no está registrada' });
    return;
  }

  const ahora = Date.now();
  if (registrosPorClave.size > 5000) {
    podarRegistrosAntiguos(ahora);
  }
  if (superaLimite(`${peticion.ip}:${codigo}`, ahora)) {
    respuesta.status(429).json({ error: 'Demasiados envíos para esta etiqueta, inténtalo más tarde' });
    return;
  }

  const { latitud, longitud, precision_metros, mensaje } = peticion.body ?? {};
  if (!coordenadaValida(latitud, -90, 90) || !coordenadaValida(longitud, -180, 180)) {
    respuesta.status(400).json({ error: 'La ubicación recibida no es válida' });
    return;
  }

  const precision = Number.isFinite(Number(precision_metros)) ? Number(precision_metros) : null;
  const mensajeLimpio = typeof mensaje === 'string' ? mensaje.trim().slice(0, 500) : null;

  db.prepare(
    `INSERT INTO ubicaciones (codigo_id, latitud, longitud, precision_metros, mensaje, fecha_compartida)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(codigo, Number(latitud), Number(longitud), precision, mensajeLimpio, new Date().toISOString());

  respuesta.status(201).json({ ok: true });
});

enrutadorUbicaciones.get('/ubicaciones', requerirSesion, (peticion, respuesta) => {
  const ubicaciones = db
    .prepare(
      `SELECT u.latitud, u.longitud, u.precision_metros, u.mensaje, u.fecha_compartida,
              c.id AS codigo_id, c.nombre_etiqueta
       FROM ubicaciones u
       JOIN codigos c ON c.id = u.codigo_id
       WHERE c.usuario_id = ?
       ORDER BY u.fecha_compartida DESC`
    )
    .all(peticion.session.usuarioId);

  respuesta.json(ubicaciones);
});

module.exports = { enrutadorUbicaciones };
