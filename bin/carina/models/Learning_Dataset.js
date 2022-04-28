const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LearningDatasetSchema = new Schema({
  version: String,
  name: String,
  file: String,
  version: Number,
  description: String,
  active: {
    type: Boolean,
    default: true
  },
  isSelected: {
    type: Boolean,
    default: false
  },
  isA: {
    type: [Schema.Types.ObjectId],
    ref: "Belief",
    default: []
  },
  has: {
    cols: {
      type: [Schema.Types.ObjectId],
      ref: "ColsDataset",
      default: []
    },
    cells: {
      type: [Schema.Types.ObjectId],
      ref: "CellsDataset",
      default: []
    }
  }
});

var LearningDataset = mongoose.model("LearningDataset", LearningDatasetSchema);
module.exports = LearningDataset;
