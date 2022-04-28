var mongoose = require("mongoose");
class Database {
  constructor() {
    this.connect();
  }

  async connect() {
    try {
      /*await mongoose.connect("mongodb://localhost:27017/db_dataset", {
        useNewUrlParser: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      });*/
      await mongoose.connect(
        "mongodb+srv://admin:bus9ichw1apcdAzc@cluster0.vzzvw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
        {
          useUnifiedTopology: true,
          useNewUrlParser: true,
          useFindAndModify: false,
        }
      );
      console.log("Connected databases.");
    } catch (e) {
      console.error(e);
    }
  }
}

/** export database */
exports.database = new Database();
