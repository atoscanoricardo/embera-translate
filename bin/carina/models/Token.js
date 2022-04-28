const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TokenSchema = new Schema({
  lemma: String,
  token: String,
  isSelect: {
    type: Boolean,
    default: true
  },
  isChecked: {
    type: Boolean,
    default: false
  },
  filename: String
});

var Token = mongoose.model("Token", TokenSchema);
module.exports = Token;
