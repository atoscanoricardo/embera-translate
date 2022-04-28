const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ResolucionSchema = new Schema({
  dependencia: { type: String, default: " " },
  numero: { type: Number, default: " " },
  fecha: { type: Date, default: " " },
  descripcion: { type: String, default: " " },
  autoridad: { type: String, default: " " },
  soporte: { type: String, default: " " },
  articulos: [{ type: Schema.Types.ObjectId, ref: "Articulo", default: [] }],
  tipo: { type: String, default: " " },
});

var ModelResolucion = mongoose.model("Resolucion", ResolucionSchema);
module.exports = ModelResolucion;
