const Documento = require("../models/Documento");
const Problem_Space = require("../models/Problem_Space");
var resolution = require("./Resolution");
//var mongoose = require("mongoose");
OId = require("mongoose").Types.ObjectId;
var { Dataset: CDataset } = require("./Dataset");
const ProblemSpace = require("../models/Problem_Space");

class Document {
  constructor() {
    this.dataset = new CDataset();
  }

  onNewCorpus(data) {
    let { name, res } = data;
    Documento.create({ nombre: name }, function (err, newCorpus) {
      if (err) return handleError(err);
      //socket.emit("onNewCorpus", newCorpus._id);
      res.send({ status: 200, id: newCorpus._id });
    });
  }

  onGetAllCorpus(data) {
    let { res } = data;
    Documento.find({}, function (err, newCorpus) {
      if (err) throw err;
      let corpus = [];

      newCorpus.map((item) =>
        corpus.push({ id: item._id, nombre: item.nombre })
      );
      res.send({ status: 200, corpus });
    });
  }

  getCorpusOfDocument(data) {
    let { idDocument, res } = data;
    Documento.findOne({ _id: idDocument })
      .populate("resoluciones")
      .exec(function (err, corpus) {
        if (err) throw err;
        res.send({ status: 200, corpus });
      });
  }

  addResolutionsToDocument(data) {
    let { resolutionsAct, idDocument, res } = data;
    resolution.addResolutions({ resolutionsAct, idDocument, Documento, res });
  }

  getResolutions(data) {
    let { idDocument, res } = data;
    Documento.findOne({ _id: idDocument })
      .populate({
        path: "resoluciones",
        populate: {
          path: "articulos",
          model: "Articulo",
        },
      })
      .exec(function (err, corpus) {
        if (err) throw err;
        let { resoluciones } = corpus;
        Problem_Space.findOne({ idDocument: idDocument })
          .select("_id")
          .populate({
            path: "has",
            select: "_id name",
          })
          .exec(function (err, problemSpace) {
            let learningDatasets = [];
            if (err) throw err;
            if (problemSpace != null) learningDatasets = problemSpace.has;
            res.send({ status: 200, resoluciones, learningDatasets });
          });
        //problemspace idDocument
      });
  }

  setDataset(data) {
    let { idDocument, nameTrain, testrain, socket } = data;
    let self = this;
    Documento.findOne({ _id: idDocument })
      .populate({
        path: "resoluciones",
        populate: {
          path: "articulos",
          model: "Articulo",
          select: "_id texto",
        },
      })
      .exec(function (err, corpus) {
        if (err) throw err;
        let { resoluciones } = corpus;
        var dsTemp = Array.prototype.concat(
          ...resoluciones.map((a) =>
            a.articulos.map((b) =>
              OId.isValid(!b._id) ? [b._id, b.texto] : [b.texto, b._id]
            )
          )
        );
        var test = (dsTemp.length * testrain) / 100;
        var dsTest = dsTemp.splice(0, Math.trunc(test));

        data.idDocument = idDocument;
        data.datasetTemp = dsTemp;
        data.datasetTest = dsTest;
        data.name = nameTrain;
        self.dataset.onUploadCorpus(data);

        socket.emit("addItem", {
          color: "green",
          text: `Obteniendo dataset de datos. ${dsTemp.length} registros encontrados`,
          status: true,
        });
      });
  }

  addArticles(data) {
    resolution.addArticles(data);
  }

  updateArticles(data) {
    resolution.updateArticles(data);
  }

  editResolutions(data) {
    resolution.editResolutions(data);
  }

  deleteArticles(data) {
    resolution.deleteArticles(data);
  }
}

module.exports = new Document();
