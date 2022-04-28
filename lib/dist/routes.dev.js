"use strict";

/*routes.js Alexander Toscano Ricardo*/
module.exports = function (params) {
  app = params.app;
  socket = params.socket;

  var _require = require("../bin/carina/Carina"),
      CCarina = _require.Carina;

  var carina = new CCarina("3.0.0"); //no enviar version por constructor
  // getters

  app.get("/version", function (req, res) {
    res.send({
      name: "Carina",
      version: carina.v
    });
  });
  app.get("/onGetAllCorpus", function (req, res) {
    carina.onGetAllCorpus({
      res: res
    });
  });
  app.get("/getCorpusOfDocument/:idDocument", function (req, res) {
    var idDocument = req.params.idDocument;
    carina.getCorpusOfDocument({
      idDocument: idDocument,
      res: res
    });
  });
  app.get("/getResolutions/:idDocument", function (req, res) {
    var idDocument = req.params.idDocument;
    carina.getResolutions({
      idDocument: idDocument,
      res: res
    });
  });
  app.post("/setDataset/:idDocument", function (req, res) {
    var idDocument = req.params.idDocument;
    var _req$body = req.body,
        nameTrain = _req$body.nameTrain,
        testrain = _req$body.testrain;
    carina.setDataset({
      idDocument: idDocument,
      nameTrain: nameTrain,
      testrain: testrain,
      socket: socket
    });
    res.send({
      status: 200
    });
  }); // setters

  app.post("/onNewCorpus/:idClient", function (req, res) {
    var idClient = req.params.idClient;
    var name = req.body.name;
    carina.onNewCorpus({
      name: name,
      res: res
    });
  });
  app.post("/addResolutions/:idDocument", function (req, res) {
    var idDocument = req.params.idDocument;
    var resolutionsAct = req.body.resolutionsAct;
    carina.addResolutions({
      resolutionsAct: resolutionsAct,
      idDocument: idDocument,
      res: res
    });
  });
  app.post("/addArticles/:idResolution", function (req, res) {
    var idResolution = req.params.idResolution;
    var editedItem = req.body.editedItem;
    console.log(editedItem);
    carina.addArticles({
      editedItem: editedItem,
      idResolution: idResolution,
      res: res
    });
  });
  app.post("/deleteArticles/:idResolution/:_id", function (req, res) {
    var _req$params = req.params,
        _id = _req$params._id,
        idResolution = _req$params.idResolution;
    carina.deleteArticles({
      idResolution: idResolution,
      _id: _id,
      res: res
    });
  });
  app.post("/setTrain/:idDataset", function (req, res) {
    var idDataset = req.params.idDataset;
    var dataset = req.body.dataset;
  });
  app.post("/prediction/:idDataset", function () {
    var idDataset = req.params.idDataset;
    var query = req.body.query;
    carina.prediction({
      idDataset: idDataset,
      query: query,
      res: res
    });
  }); // updates

  app.post("/updateArticles/:idResolution", function (req, res) {
    var idResolution = req.params.idResolution;
    var editedItem = req.body.editedItem;
    carina.updateArticles({
      editedItem: editedItem,
      res: res
    });
  });
  app.post("/editResolutions/:idResolutions", function (req, res) {
    var idResolutions = req.params.idResolutions;
    var resolutionsAct = req.body.resolutionsAct;
    carina.editResolutions({
      resolutionsAct: resolutionsAct,
      idResolutions: idResolutions,
      res: res
    });
  });
};