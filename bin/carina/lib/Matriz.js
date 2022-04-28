var fs = require("fs");

class Matriz {
  resetFile(file) {
    fs.writeFile(file, "", function(err) {
      if (err) throw err;
    });
  }
}

exports.matriz = new Matriz();
