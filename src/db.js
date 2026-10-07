function crearBaseDatos(d1) {
  return {
    get(consulta, ...parametros) {
      const sentencia = parametros.length > 0 ? d1.prepare(consulta).bind(...parametros) : d1.prepare(consulta);
      return sentencia.first();
    },

    async all(consulta, ...parametros) {
      const sentencia = parametros.length > 0 ? d1.prepare(consulta).bind(...parametros) : d1.prepare(consulta);
      const { results } = await sentencia.all();
      return results;
    },

    async run(consulta, ...parametros) {
      const sentencia = parametros.length > 0 ? d1.prepare(consulta).bind(...parametros) : d1.prepare(consulta);
      const resultado = await sentencia.run();
      return {
        lastInsertRowid: resultado.meta.last_row_id,
        changes: resultado.meta.changes
      };
    }
  };
}

module.exports = { crearBaseDatos };
