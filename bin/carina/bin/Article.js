const Articulo = require("../models/Articulo");

class Article {
  constructor() {}

  addArticles(data) {
    let { editedItem, idResolution, res, Resolucion } = data;
    Articulo.create(editedItem, function (err, articulo) {
      if (err) return handleError(err);
      let idArticulo = articulo._id;
      Resolucion.updateOne(
        { _id: idResolution },
        { $push: { articulos: idArticulo } },
        function (err, resolution) {
          res.send({ status: 200, idArticulo });
        }
      );
    });
  }

  updateArticles(data) {
    let { editedItem, res } = data;
    let id = editedItem._id;

    Articulo.updateOne({ _id: id }, editedItem, function (err, articulo) {
      if (err) return handleError(err);

      res.send({ status: 200, articulo });
    });
  }

  deleteArticle(data) {
    let { _id, res } = data;
    Articulo.deleteOne({ _id: _id }, function (err, articulo) {
      if (err) return handleError(err);
      res.send({ status: 200, data: articulo });
    });
  }
}

module.exports = new Article();
