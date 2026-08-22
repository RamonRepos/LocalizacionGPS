const crypto = require('node:crypto');

const LONGITUD_DERIVADA = 64;

function normalizarEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashContrasena(contrasena) {
  const sal = crypto.randomBytes(16).toString('hex');
  const derivada = crypto.scryptSync(contrasena, sal, LONGITUD_DERIVADA).toString('hex');
  return `${sal}:${derivada}`;
}

function verificarContrasena(contrasena, hashAlmacenado) {
  const [sal, derivadaHex] = hashAlmacenado.split(':');
  if (!sal || !derivadaHex) return false;

  const esperada = Buffer.from(derivadaHex, 'hex');
  const obtenida = crypto.scryptSync(contrasena, sal, LONGITUD_DERIVADA);
  return esperada.length === obtenida.length && crypto.timingSafeEqual(esperada, obtenida);
}

module.exports = { normalizarEmail, esEmailValido, hashContrasena, verificarContrasena };
