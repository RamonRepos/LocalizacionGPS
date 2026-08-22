const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const carpetaDatos = path.join(__dirname, '..', 'datos');
fs.mkdirSync(carpetaDatos, { recursive: true });

const db = new DatabaseSync(path.join(carpetaDatos, 'localizacion.db'));

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS usuarios (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT    NOT NULL UNIQUE,
    hash_contrasena TEXT    NOT NULL,
    fecha_creacion  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS codigos (
    id              TEXT    PRIMARY KEY,
    usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre_etiqueta TEXT,
    fecha_creacion  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS ubicaciones (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_id        TEXT    NOT NULL REFERENCES codigos(id) ON DELETE CASCADE,
    latitud          REAL    NOT NULL,
    longitud         REAL    NOT NULL,
    precision_metros REAL,
    mensaje          TEXT,
    fecha_compartida TEXT    NOT NULL
  );
`);

module.exports = { db };
