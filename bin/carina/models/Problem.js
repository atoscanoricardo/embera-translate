const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProblemSchema = new Schema({
  name: String
});

var Problem = mongoose.model("Problem", ProblemSchema);
module.exports = Problem;
