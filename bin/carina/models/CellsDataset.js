const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CellsDatasetSchema = new Schema({
  isA: String,
  learningDatasetId: {
    type: Schema.Types.ObjectId,
    ref: "LearningDataset"
  },
  has: {
    head: {
      type: Schema.Types.ObjectId,
      ref: "Labels"
    },
    field: {
      type: Schema.Types.ObjectId,
      ref: "Belief"
    },
    probability: Number
  },
  version: Number
});

var CellsDataset = mongoose.model("CellsDataset", CellsDatasetSchema);
module.exports = CellsDataset;
