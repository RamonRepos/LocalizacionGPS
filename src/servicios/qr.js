const QRCode = require('qrcode');
const { PDFDocument, PDFString, StandardFonts, rgb } = require('pdf-lib');

const ANCHO_PAGINA = 595.28;
const ALTO_PAGINA = 841.89;

async function generarQrPng(contenido) {
  return QRCode.toBuffer(contenido, {
    type: 'png',
    width: 600,
    margin: 3,
    errorCorrectionLevel: 'M'
  });
}

function centrar(texto, fuente, tamano) {
  return (ANCHO_PAGINA - fuente.widthOfTextAtSize(texto, tamano)) / 2;
}

function agregarEnlace(pagina, documento, url, rectangulo) {
  const anotacion = documento.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    Rect: [rectangulo.x, rectangulo.y, rectangulo.x + rectangulo.ancho, rectangulo.y + rectangulo.alto],
    Border: [0, 0, 0],
    A: documento.context.obj({
      Type: 'Action',
      S: 'URI',
      URI: PDFString.of(url)
    })
  });
  pagina.node.addAnnot(documento.context.register(anotacion));
}

async function generarQrPdf(contenido, titulo) {
  const etiqueta = titulo || 'Etiqueta QR de localización';
  const imagenQr = await QRCode.toBuffer(contenido, {
    type: 'png',
    width: 720,
    margin: 2,
    errorCorrectionLevel: 'M'
  });

  const documento = await PDFDocument.create();
  documento.setTitle(etiqueta);
  const pagina = documento.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
  const fuente = await documento.embedFont(StandardFonts.Helvetica);

  pagina.drawText(etiqueta, {
    x: centrar(etiqueta, fuente, 20),
    y: ALTO_PAGINA - 70,
    size: 20,
    font: fuente
  });

  const ayuda = 'Imprime esta etiqueta y colócala en tu mascota u objeto.';
  pagina.drawText(ayuda, {
    x: centrar(ayuda, fuente, 12),
    y: ALTO_PAGINA - 105,
    size: 12,
    font: fuente,
    color: rgb(0.33, 0.33, 0.33)
  });

  const anchoImagen = 360;
  const alturaImagen = anchoImagen;
  const imagen = await documento.embedPng(imagenQr);
  const posicionImagen = {
    x: (ANCHO_PAGINA - anchoImagen) / 2,
    y: ALTO_PAGINA - 150 - alturaImagen
  };
  pagina.drawImage(imagen, {
    x: posicionImagen.x,
    y: posicionImagen.y,
    width: anchoImagen,
    height: alturaImagen
  });

  const tamanoEnlace = 10;
  const anchoEnlace = fuente.widthOfTextAtSize(contenido, tamanoEnlace);
  const posicionEnlace = {
    x: (ANCHO_PAGINA - anchoEnlace) / 2,
    y: posicionImagen.y - 24
  };
  pagina.drawText(contenido, {
    x: posicionEnlace.x,
    y: posicionEnlace.y,
    size: tamanoEnlace,
    font: fuente,
    color: rgb(0.2, 0.2, 0.2)
  });
  agregarEnlace(pagina, documento, contenido, {
    x: posicionEnlace.x,
    y: posicionEnlace.y - 2,
    ancho: anchoEnlace,
    alto: tamanoEnlace + 4
  });

  return Buffer.from(await documento.save());
}

module.exports = { generarQrPng, generarQrPdf };
