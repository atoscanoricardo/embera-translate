"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Documento = require("../models/Documento");

var Problem_Space = require("../models/Problem_Space");

var resolution = require("./Resolution"); //var mongoose = require("mongoose");


OId = require("mongoose").Types.ObjectId;

var _require = require("./Dataset"),
    CDataset = _require.Dataset;

var ProblemSpace = require("../models/Problem_Space");

var Document =
/*#__PURE__*/
function () {
  function Document() {
    _classCallCheck(this, Document);

    this.dataset = new CDataset();
  }

  _createClass(Document, [{
    key: "onNewCorpus",
    value: function onNewCorpus(data) {
      var name = data.name,
          res = data.res;
      Documento.create({
        nombre: name
      }, function (err, newCorpus) {
        if (err) return handleError(err); //socket.emit("onNewCorpus", newCorpus._id);

        res.send({
          status: 200,
          id: newCorpus._id
        });
      });
    }
  }, {
    key: "onGetAllCorpus",
    value: function onGetAllCorpus(data) {
      var res = data.res;
      Documento.find({}, function (err, newCorpus) {
        if (err) throw err;
        var corpus = [];
        newCorpus.map(function (item) {
          return corpus.push({
            id: item._id,
            nombre: item.nombre
          });
        });
        res.send({
          status: 200,
          corpus: corpus
        });
      });
    }
  }, {
    key: "getCorpusOfDocument",
    value: function getCorpusOfDocument(data) {
      var idDocument = data.idDocument,
          res = data.res;
      Documento.findOne({
        _id: idDocument
      }).populate("resoluciones").exec(function (err, corpus) {
        if (err) throw err;
        res.send({
          status: 200,
          corpus: corpus
        });
      });
    }
  }, {
    key: "addResolutionsToDocument",
    value: function addResolutionsToDocument(data) {
      var resolutionsAct = data.resolutionsAct,
          idDocument = data.idDocument,
          res = data.res;
      resolution.addResolutions({
        resolutionsAct: resolutionsAct,
        idDocument: idDocument,
        Documento: Documento,
        res: res
      });
    }
  }, {
    key: "getResolutions",
    value: function getResolutions(data) {
      var idDocument = data.idDocument,
          res = data.res;
      Documento.findOne({
        _id: idDocument
      }).populate({
        path: "resoluciones",
        populate: {
          path: "articulos",
          model: "Articulo"
        }
      }).exec(function (err, corpus) {
        if (err) throw err;
        var resoluciones = corpus.resoluciones;
        Problem_Space.findOne({
          idDocument: idDocument
        }).select("_id").populate({
          path: "has",
          select: "_id name"
        }).exec(function (err, problemSpace) {
          var learningDatasets = problemSpace.has;
          res.send({
            status: 200,
            resoluciones: resoluciones,
            learningDatasets: learningDatasets
          });
        }); //problemspace idDocument
      });
    }
  }, {
    key: "setDataset",
    value: function setDataset(data) {
      var idDocument = data.idDocument,
          nameTrain = data.nameTrain,
          testrain = data.testrain,
          socket = data.socket;
      var self = this;
      Documento.findOne({
        _id: idDocument
      }).populate({
        path: "resoluciones",
        populate: {
          path: "articulos",
          model: "Articulo",
          select: "_id texto"
        }
      }).exec(function (err, corpus) {
        var _Array$prototype;

        if (err) throw err;
        var resoluciones = corpus.resoluciones;

        var datasetTemp = (_Array$prototype = Array.prototype).concat.apply(_Array$prototype, _toConsumableArray(resoluciones.map(function (a) {
          return a.articulos.map(function (b) {
            return OId.isValid(!b._id) ? [b._id, b.texto] : [b.texto, b._id];
          });
        })));

        var datasetTest = datasetTemp.splice(0, Math.trunc(datasetTemp.length * testrain / 100));
        data.idDocument = idDocument;
        data.datasetTemp = datasetTemp;
        data.datasetTest = datasetTest;
        data.name = nameTrain;
        self.dataset.onUploadCorpus(data);
        socket.emit("addItem", {
          color: "green",
          text: "Obteniendo dataset de datos. ".concat(datasetTemp.length, " registros encontrados"),
          status: true
        });
      });
    }
  }, {
    key: "addArticles",
    value: function addArticles(data) {
      resolution.addArticles(data);
    }
  }, {
    key: "updateArticles",
    value: function updateArticles(data) {
      resolution.updateArticles(data);
    }
  }, {
    key: "editResolutions",
    value: function editResolutions(data) {
      resolution.editResolutions(data);
    }
  }, {
    key: "deleteArticles",
    value: function deleteArticles(data) {
      resolution.deleteArticles(data);
    }
  }]);

  return Document;
}();

module.exports = new Document();