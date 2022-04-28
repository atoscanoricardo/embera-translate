const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CorpusSchema = new Schema({
  document: Number,
  input: Map,
  labelSDG: String,
  filename: String,
  suma_unos_de_features: Number
});

var Corpus = mongoose.model("Corpus", CorpusSchema);
module.exports = Corpus;
