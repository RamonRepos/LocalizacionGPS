const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

async function generarQrPng(contenido) {
  return QRCode.toBuffer(contenido, {
    type: 'png',
    width: 600,
    margin: 3,
    errorCorrectionLevel: 'M'
  });
}

function generarQrPdf(contenido, titulo) {
  return new Promise((resolver, rechazar) => {
    const trozos = [];
    const documento = new PDFDocument({
      size: 'A4',
      info: { Title: titulo || 'Etiqueta QR de localización' }
    });

    documento.on('data', (trozo) => trozos.push(trozo));
    documento.on('end', () => resolver(Buffer.concat(trozos)));
    documento.on('error', rechazar);

    documento.fontSize(20).text(titulo || 'Etiqueta QR de localización', { align: 'center' });
    documento.moveDown(0.5);
    documento.fontSize(12).fillColor('#555555').text(
      'Imprime esta etiqueta y colócala en tu mascota u objeto.',
      { align: 'center' }
    );
    documento.moveDown(1.5);

    const anchoImagen = 360;
    const margenIzquierdo = documento.page.margins.left;
    const anchoUtil = documento.page.width - margenIzquierdo - documento.page.margins.right;
    const coordenadaX = margenIzquierdo + (anchoUtil - anchoImagen) / 2;

    QRCode.toBuffer(contenido, { type: 'png', width: 720, margin: 2 }, (error, imagen) => {
      if (error) {
        rechazar(error);
        return;
      }
      documento.image(imagen, coordenadaX, documento.y, { width: anchoImagen });
      documento.y += anchoImagen + 24;
      documento.fontSize(10).fillColor('#333333').text(contenido, {
        align: 'center',
        link: contenido
      });
      documento.end();
    });
  });
}

module.exports = { generarQrPng, generarQrPdf };
