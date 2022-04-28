const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ColsDatasetSchema = new Schema({
  isA: [String],
  has: {
    head: {
      type: Schema.Types.ObjectId,
      ref: "Labels"
    }
  },
  version: Number
});

var ColsDataset = mongoose.model("ColsDataset", ColsDatasetSchema);
module.exports = ColsDataset;
