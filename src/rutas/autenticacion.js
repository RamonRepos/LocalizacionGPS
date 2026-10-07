const express = require('express');

const { normalizarEmail, esEmailValido, hashContrasena, verificarContrasena } = require('../servicios/usuarios');

function requerirSesion(peticion, respuesta, siguiente) {
  if (!peticion.usuarioSesion) {
    respuesta.status(401).json({ error: 'Debes iniciar sesión' });
    return;
  }
  siguiente();
}

function crearEnrutadorAutenticacion(db) {
  const enrutadorAutenticacion = express.Router();

  enrutadorAutenticacion.post('/registro', async (peticion, respuesta) => {
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

    const existente = await db.get('SELECT id FROM usuarios WHERE email = ?', email);
    if (existente) {
      respuesta.status(409).json({ error: 'Ya existe una cuenta con este email' });
      return;
    }

    const resultado = await db.run(
      'INSERT INTO usuarios (email, hash_contrasena, fecha_creacion) VALUES (?, ?, ?)',
      email,
      hashContrasena(contrasena),
      new Date().toISOString()
    );

    respuesta.fijarSesion(Number(resultado.lastInsertRowid));
    respuesta.status(201).json({ email });
  });

  enrutadorAutenticacion.post('/login', async (peticion, respuesta) => {
    const email = normalizarEmail(peticion.body?.email);
    const contrasena = peticion.body?.contrasena;

    const usuario = await db.get('SELECT * FROM usuarios WHERE email = ?', email);
    if (!usuario || typeof contrasena !== 'string' || !verificarContrasena(contrasena, usuario.hash_contrasena)) {
      respuesta.status(401).json({ error: 'Email o contraseña incorrectos' });
      return;
    }

    respuesta.fijarSesion(usuario.id);
    respuesta.json({ email: usuario.email });
  });

  enrutadorAutenticacion.post('/logout', (peticion, respuesta) => {
    respuesta.borrarSesion();
    respuesta.json({ ok: true });
  });

  enrutadorAutenticacion.get('/sesion', async (peticion, respuesta) => {
    if (!peticion.usuarioSesion) {
      respuesta.status(401).json({ error: 'No hay sesión iniciada' });
      return;
    }
    const usuario = await db.get('SELECT email FROM usuarios WHERE id = ?', peticion.usuarioSesion);

    if (!usuario) {
      respuesta.borrarSesion();
      respuesta.status(401).json({ error: 'No hay sesión iniciada' });
      return;
    }
    respuesta.json({ email: usuario.email });
  });

  return enrutadorAutenticacion;
}

module.exports = { crearEnrutadorAutenticacion, requerirSesion };
