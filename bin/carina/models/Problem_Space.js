const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProblemSpaceSchema = new Schema({
  name: String,
  version: Number,
  isA: {
    type: [Schema.Types.ObjectId],
    ref: "Problem",
    default: [],
  },
  has: [
    {
      type: Schema.Types.ObjectId,
      ref: "LearningDataset",
    },
  ],
  idDocument: {
    type: Schema.Types.ObjectId,
    ref: "Documento",
  },
});

var ProblemSpace = mongoose.model("ProblemSpace", ProblemSpaceSchema);
module.exports = ProblemSpace;
