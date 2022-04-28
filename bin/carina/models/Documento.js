const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DocumetoSchema = new Schema({
  nombre: String,
  resoluciones: [
    { type: Schema.Types.ObjectId, ref: "Resolucion", default: [] },
  ],
});

var Documento = mongoose.model("Documento", DocumetoSchema);
module.exports = Documento;
