"use strict";

var mongoose = require("mongoose");

var Schema = mongoose.Schema;
var ProblemSpaceSchema = new Schema({
  name: String,
  version: Number,
  isA: {
    type: [Schema.Types.ObjectId],
    ref: "Problem",
    "default": []
  },
  has: [{
    type: Schema.Types.ObjectId,
    ref: "LearningDataset"
  }],
  idDocument: {
    type: Schema.Types.ObjectId,
    ref: "Documento"
  }
});
var ProblemSpace = mongoose.model("ProblemSpace", ProblemSpaceSchema);
module.exports = ProblemSpace;