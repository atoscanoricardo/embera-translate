const Resolucion = require("../models/Resolucion");
const article = require("./Article");

class Resolution {
  constructor() {}
  addResolutions(data) {
    let { resolutionsAct, idDocument, Documento, res } = data;
    Resolucion.create(resolutionsAct, function (err, resolucion) {
      if (err) return handleError(err);
      let idResolucion = resolucion._id;
      Documento.updateOne(
        { _id: idDocument },
        { $push: { resoluciones: idResolucion } },
        function (err, newCorpus) {
          console.log(newCorpus);
          res.send({ status: 200, idResolucion: idResolucion });
        }
      );
    });
  }

  editResolutions(data) {
    let { resolutionsAct, idResolutions, res } = data;
    Resolucion.findOneAndUpdate({ _id: idResolutions }, resolutionsAct).exec(
      function (err, resolucion) {
        if (err) return handleError(err);
        res.send({ status: 200 });
      }
    );
  }

  async deleteArticles(data) {
    let { idResolution, _id, res } = await data;

    const resolucion = await Resolucion.findOne({ _id: idResolution });
    let articulos = await resolucion.articulos;
    articulos = await articulos.filter((a) => a != _id);
    resolucion.fecha = await new Date(resolucion.fecha);
    resolucion.articulos = await articulos;
    await resolucion.save();
    await article.deleteArticle({ _id, res });
  }

  addArticles(data) {
    let { editedItem, idResolution, res } = data;
    article.addArticles({
      editedItem,
      idResolution,
      res,
      Resolucion,
    });
  }

  updateArticles(data) {
    let { editedItem, res } = data;
    article.updateArticles({
      editedItem,
      res,
    });
  }
}

module.exports = new Resolution();
