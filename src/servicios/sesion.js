const crypto = require('node:crypto');

const NOMBRE_COOKIE = 'sesion';
const DURACION_MS = 7 * 24 * 60 * 60 * 1000;

function calcularFirma(valor, secreto) {
  return crypto.createHmac('sha256', secreto).update(valor).digest('base64url');
}

function construirValorCookie(usuarioId, secreto) {
  const valor = String(usuarioId);
  return `${valor}.${calcularFirma(valor, secreto)}`;
}

function interpretarValorCookie(valor, secreto) {
  if (typeof valor !== 'string') return null;

  const separador = valor.lastIndexOf('.');
  if (separador <= 0) return null;

  const usuarioId = valor.slice(0, separador);
  const firma = Buffer.from(valor.slice(separador + 1));
  const firmaEsperada = Buffer.from(calcularFirma(usuarioId, secreto));
  if (firma.length !== firmaEsperada.length || !crypto.timingSafeEqual(firma, firmaEsperada)) {
    return null;
  }

  const numero = Number(usuarioId);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function analizarCookies(cabecera) {
  const cookies = {};
  for (const par of (cabecera ?? '').split(';')) {
    const separador = par.indexOf('=');
    if (separador === -1) continue;
    const nombre = par.slice(0, separador).trim();
    if (!nombre) continue;
    cookies[nombre] = decodeURIComponent(par.slice(separador + 1).trim());
  }
  return cookies;
}

function middlewareSesion(secretoProporcionado) {
  let secreto = secretoProporcionado;

  return (peticion, respuesta, siguiente) => {
    if (!secreto) {
      secreto = crypto.randomBytes(32).toString('hex');
    }

    const cookies = analizarCookies(peticion.headers.cookie);
    peticion.usuarioSesion = interpretarValorCookie(cookies[NOMBRE_COOKIE], secreto);

    respuesta.fijarSesion = (usuarioId) => {
      respuesta.cookie(NOMBRE_COOKIE, construirValorCookie(usuarioId, secreto), {
        httpOnly: true,
        sameSite: 'lax',
        secure: peticion.secure,
        path: '/',
        maxAge: DURACION_MS
      });
    };

    respuesta.borrarSesion = () => {
      respuesta.clearCookie(NOMBRE_COOKIE, { path: '/' });
    };

    siguiente();
  };
}

module.exports = { middlewareSesion };
