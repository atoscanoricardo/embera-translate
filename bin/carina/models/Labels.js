const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const LabelsSchema = new Schema({
  name: String,
  isA: String,
  learningDatasetId: {
    type: Schema.Types.ObjectId,
    ref: "LearningDataset"
  },
  has: {
    probability: Number
  }
});

var Labels = mongoose.model("Labels", LabelsSchema);
module.exports = Labels;
