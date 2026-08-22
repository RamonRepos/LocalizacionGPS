const vistaAutenticacion = document.getElementById('vista-autenticacion');
const vistaAplicacion = document.getElementById('vista-aplicacion');
const zonaSesion = document.getElementById('zona-sesion');
const pestanaLogin = document.getElementById('pestana-login');
const pestanaRegistro = document.getElementById('pestana-registro');
const formularioLogin = document.getElementById('formulario-login');
const formularioRegistro = document.getElementById('formulario-registro');
const errorAutenticacion = document.getElementById('error-autenticacion');
const formularioCodigo = document.getElementById('formulario-codigo');
const nombreEtiqueta = document.getElementById('nombre-etiqueta');
const resultadoCodigo = document.getElementById('resultado-codigo');
const imagenQr = document.getElementById('imagen-qr');
const urlCompartir = document.getElementById('url-compartir');
const enlacePng = document.getElementById('enlace-png');
const enlacePdf = document.getElementById('enlace-pdf');
const botonCopiarUrl = document.getElementById('boton-copiar-url');
const listaCodigos = document.getElementById('lista-codigos');
const sinCodigos = document.getElementById('sin-codigos');
const tablaUbicaciones = document.getElementById('tabla-ubicaciones').querySelector('tbody');
const sinUbicaciones = document.getElementById('sin-ubicaciones');
const botonRefrescar = document.getElementById('boton-refrescar');

function crearElemento(etiqueta, texto) {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  return elemento;
}

function formatearFecha(fechaIso) {
  return new Date(fechaIso).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
}

function mostrarAutenticacion() {
  vistaAutenticacion.hidden = false;
  vistaAplicacion.hidden = true;
  zonaSesion.replaceChildren();
}

function mostrarAplicacion(sesion) {
  vistaAutenticacion.hidden = true;
  vistaAplicacion.hidden = false;

  const saludo = crearElemento('span', sesion.email);
  const botonLogout = crearElemento('button', 'Cerrar sesión');
  botonLogout.className = 'boton boton-enlace';
  botonLogout.addEventListener('click', cerrarSesion);
  zonaSesion.replaceChildren(saludo, botonLogout);

  cargarCodigos();
  cargarUbicaciones();
}

async function cerrarSesion() {
  await fetch('/api/logout', { method: 'POST' });
  location.reload();
}

pestanaLogin.addEventListener('click', () => alternarPestanas(true));
pestanaRegistro.addEventListener('click', () => alternarPestanas(false));

function alternarPestanas(mostrarLogin) {
  pestanaLogin.classList.toggle('activa', mostrarLogin);
  pestanaRegistro.classList.toggle('activa', !mostrarLogin);
  formularioLogin.hidden = !mostrarLogin;
  formularioRegistro.hidden = mostrarLogin;
  errorAutenticacion.textContent = '';
}

async function enviarFormularioAutenticacion(url, cuerpo) {
  errorAutenticacion.textContent = '';
  const respuesta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo)
  });
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    errorAutenticacion.textContent = datos.error ?? 'Se ha producido un error, inténtalo de nuevo';
    return;
  }
  mostrarAplicacion(datos);
}

formularioLogin.addEventListener('submit', (evento) => {
  evento.preventDefault();
  enviarFormularioAutenticacion('/api/login', {
    email: document.getElementById('login-email').value,
    contrasena: document.getElementById('login-contrasena').value
  });
});

formularioRegistro.addEventListener('submit', (evento) => {
  evento.preventDefault();
  enviarFormularioAutenticacion('/api/registro', {
    email: document.getElementById('registro-email').value,
    contrasena: document.getElementById('registro-contrasena').value
  });
});

formularioCodigo.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const respuesta = await fetch('/api/codigos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre_etiqueta: nombreEtiqueta.value })
  });
  if (!respuesta.ok) return;
  const codigo = await respuesta.json();

  imagenQr.src = `/qr/${codigo.id}/png`;
  urlCompartir.textContent = codigo.url;
  enlacePng.href = `/qr/${codigo.id}/png?descarga=1`;
  enlacePdf.href = `/qr/${codigo.id}/pdf`;
  enlacePng.download = `qr-${codigo.id}.png`;
  enlacePdf.download = `qr-${codigo.id}.pdf`;
  resultadoCodigo.hidden = false;
  nombreEtiqueta.value = '';

  await cargarCodigos();
});

botonCopiarUrl.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(urlCompartir.textContent);
    botonCopiarUrl.textContent = '¡Copiado!';
    setTimeout(() => { botonCopiarUrl.textContent = 'Copiar enlace'; }, 2000);
  } catch {}
});

async function cargarCodigos() {
  const respuesta = await fetch('/api/codigos');
  if (!respuesta.ok) return;
  const codigos = await respuesta.json();

  sinCodigos.hidden = codigos.length > 0;
  listaCodigos.replaceChildren(
    ...codigos.map((codigo) => {
      const item = document.createElement('li');
      item.appendChild(crearElemento('strong', codigo.nombre_etiqueta || 'Sin nombre'));
      item.appendChild(crearElemento('span', ` · creada el ${formatearFecha(codigo.fecha_creacion)}`));
      return item;
    })
  );
}

async function cargarUbicaciones() {
  const respuesta = await fetch('/api/ubicaciones');
  if (!respuesta.ok) return;
  const ubicaciones = await respuesta.json();

  sinUbicaciones.hidden = ubicaciones.length > 0;
  tablaUbicaciones.parentElement.hidden = ubicaciones.length === 0;

  tablaUbicaciones.replaceChildren(
    ...ubicaciones.map((ubicacion) => {
      const fila = document.createElement('tr');

      fila.appendChild(crearElemento('td', formatearFecha(ubicacion.fecha_compartida)));
      fila.appendChild(crearElemento('td', ubicacion.nombre_etiqueta || 'Sin nombre'));

      const coordenadas = `${ubicacion.latitud.toFixed(5)}, ${ubicacion.longitud.toFixed(5)}`;
      fila.appendChild(crearElemento('td', coordenadas));

      const precision = ubicacion.precision_metros != null
        ? `±${Math.round(ubicacion.precision_metros)} m`
        : '—';
      fila.appendChild(crearElemento('td', precision));
      fila.appendChild(crearElemento('td', ubicacion.mensaje || '—'));

      const celdaMapa = document.createElement('td');
      const enlaceMapa = crearElemento('a', 'Ver en mapa');
      enlaceMapa.href = `https://www.openstreetmap.org/?mlat=${ubicacion.latitud}&mlon=${ubicacion.longitud}#map=17/${ubicacion.latitud}/${ubicacion.longitud}`;
      enlaceMapa.target = '_blank';
      enlaceMapa.rel = 'noopener noreferrer';
      celdaMapa.appendChild(enlaceMapa);
      fila.appendChild(celdaMapa);

      return fila;
    })
  );
}

botonRefrescar.addEventListener('click', cargarUbicaciones);

setInterval(() => {
  if (!vistaAplicacion.hidden) cargarUbicaciones();
}, 30000);

async function iniciar() {
  const respuesta = await fetch('/api/sesion');
  if (respuesta.ok) {
    mostrarAplicacion(await respuesta.json());
  } else {
    mostrarAutenticacion();
  }
}

iniciar();
