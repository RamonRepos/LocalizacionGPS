const express = require('express');

const { db } = require('../db');
const { normalizarEmail, esEmailValido, hashContrasena, verificarContrasena } = require('../servicios/usuarios');

const enrutadorAutenticacion = express.Router();

function requerirSesion(peticion, respuesta, siguiente) {
  if (!peticion.session.usuarioId) {
    respuesta.status(401).json({ error: 'Debes iniciar sesión' });
    return;
  }
  siguiente();
}

enrutadorAutenticacion.post('/registro', (peticion, respuesta) => {
  const email = normalizarEmail(peticion.body?.email);
  const contrasena = peticion.body?.contrasena;

  if (!esEmailValido(email)) {
    respuesta.status(400).json({ error: 'El email no tiene un formato válido' });
    return;
  }
  if (typeof contrasena !== 'string' || contrasena.length < 8) {
    respuesta.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    return;
  }

  const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
  if (existente) {
    respuesta.status(409).json({ error: 'Ya existe una cuenta con este email' });
    return;
  }

  const resultado = db
    .prepare('INSERT INTO usuarios (email, hash_contrasena, fecha_creacion) VALUES (?, ?, ?)')
    .run(email, hashContrasena(contrasena), new Date().toISOString());

  peticion.session.usuarioId = Number(resultado.lastInsertRowid);
  respuesta.status(201).json({ email });
});

enrutadorAutenticacion.post('/login', (peticion, respuesta) => {
  const email = normalizarEmail(peticion.body?.email);
  const contrasena = peticion.body?.contrasena;

  const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  if (!usuario || typeof contrasena !== 'string' || !verificarContrasena(contrasena, usuario.hash_contrasena)) {
    respuesta.status(401).json({ error: 'Email o contraseña incorrectos' });
    return;
  }

  peticion.session.usuarioId = usuario.id;
  respuesta.json({ email: usuario.email });
});

enrutadorAutenticacion.post('/logout', (peticion, respuesta) => {
  peticion.session.destroy(() => {
    respuesta.clearCookie('connect.sid');
    respuesta.json({ ok: true });
  });
});

enrutadorAutenticacion.get('/sesion', (peticion, respuesta) => {
  if (!peticion.session.usuarioId) {
    respuesta.status(401).json({ error: 'No hay sesión iniciada' });
    return;
  }
  const usuario = db
    .prepare('SELECT email FROM usuarios WHERE id = ?')
    .get(peticion.session.usuarioId);

  if (!usuario) {
    peticion.session.destroy(() => {});
    respuesta.status(401).json({ error: 'No hay sesión iniciada' });
    return;
  }
  respuesta.json({ email: usuario.email });
});

module.exports = { enrutadorAutenticacion, requerirSesion };
