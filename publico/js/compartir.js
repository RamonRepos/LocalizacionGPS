const codigo = window.location.pathname.split('/')[2];

const panelCompartir = document.getElementById('panel-compartir');
const panelGracias = document.getElementById('panel-gracias');
const panelErrorCodigo = document.getElementById('panel-error-codigo');
const botonCompartir = document.getElementById('boton-compartir');
const campoMensaje = document.getElementById('mensaje');
const estado = document.getElementById('estado');

const mensajesErrorGps = {
  1: 'Permiso de ubicación denegado. Activa la ubicación para esta página en los ajustes del navegador y vuelve a intentarlo.',
  2: 'No se ha podido determinar tu ubicación. Comprueba que el GPS esté activado.',
  3: 'Ha tardado demasiado en obtenerse la ubicación. Inténtalo de nuevo.'
};

function informar(texto) {
  estado.textContent = texto;
}

if (!codigo) {
  panelCompartir.hidden = true;
  panelErrorCodigo.hidden = false;
} else {
  botonCompartir.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      informar('Tu navegador no permite compartir la ubicación.');
      return;
    }
    botonCompartir.disabled = true;
    informar('Obteniendo tu ubicación…');
    navigator.geolocation.getCurrentPosition(enviarUbicacion, falloGps, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    });
  });
}

async function enviarUbicacion(posicion) {
  informar('Enviando…');
  const cuerpo = {
    latitud: posicion.coords.latitude,
    longitud: posicion.coords.longitude,
    precision_metros: posicion.coords.accuracy,
    mensaje: campoMensaje.value
  };

  try {
    const respuesta = await fetch(`/api/compartir/${encodeURIComponent(codigo)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo)
    });

    if (respuesta.ok) {
      panelCompartir.hidden = true;
      panelGracias.hidden = false;
      return;
    }
    const datos = await respuesta.json().catch(() => ({}));
    informar(datos.error ?? 'No se ha podido enviar la ubicación, inténtalo de nuevo.');
  } catch {
    informar('Sin conexión. Comprueba tu internet e inténtalo de nuevo.');
  }
  botonCompartir.disabled = false;
}

function falloGps(error) {
  informar(mensajesErrorGps[error.code] ?? 'No se ha podido obtener tu ubicación.');
  botonCompartir.disabled = false;
}
