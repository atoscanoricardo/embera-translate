const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ArticuloSchema = new Schema({
  numeracion: String,
  articulo: String,
  etiqueta: String,
  texto: String,
});

var Articulo = mongoose.model("Articulo", ArticuloSchema);
module.exports = Articulo;
