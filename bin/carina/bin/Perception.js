var { Naive_Bayes } = require("./Naive_Bayes");
class Perception {
  constructor() {
    this.nb = new Naive_Bayes();
  }

  prediction(data) {
    this.nb.prediction(data);
  }
}
exports.perception = new Perception();
