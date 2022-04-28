"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var _require = require("../lib/NPLRegex"),
    npl = _require.npl; //const uuidv4 = require("uuid");


var _require2 = require("uuid"),
    uuidv4 = _require2.v4;

var path = require("path");

var _ = require("lodash");

var _require3 = require("./Naive_Bayes_Functions"),
    nBF = _require3.nBF;

var async = require("async");

var Naive_Bayes =
/*#__PURE__*/
function () {
  function Naive_Bayes() {
    _classCallCheck(this, Naive_Bayes);

    this.datasetTest = [];
  }

  _createClass(Naive_Bayes, [{
    key: "processData",
    value: function processData(data) {
      var socket = data.socket;
      async.autoInject({
        uploadFileFromCsv: function uploadFileFromCsv(callback) {
          return nBF.uploadFileFromCsv(data, callback);
        },
        createProblemSpace: function createProblemSpace(uploadFileFromCsv, callback) {
          return nBF.createProblemSpace(uploadFileFromCsv, callback);
        },
        createLearningDataset: function createLearningDataset(createProblemSpace, callback) {
          return nBF.createLearningDataset(createProblemSpace, callback);
        },
        prepareDocument: function prepareDocument(createLearningDataset, callback) {
          return nBF.prepareDocument(createLearningDataset, callback);
        },
        generateTokens: function generateTokens(prepareDocument, callback) {
          return nBF.generateTokens(prepareDocument, callback);
        },
        generateIdsTokens: function generateIdsTokens(generateTokens, callback) {
          return nBF.generateIdsTokens(generateTokens, callback);
        },
        generateMatriz: function generateMatriz(generateIdsTokens, callback) {
          return nBF.generateMatriz(generateIdsTokens, callback);
        },
        calculateProbability: function calculateProbability(generateMatriz, callback) {
          return nBF.calculateProbability(generateMatriz, callback);
        },
        calculateProbabilityLabels: function calculateProbabilityLabels(calculateProbability, callback) {
          return nBF.calculateProbabilityLabels(calculateProbability, callback);
        },
        saveLabelsInDatabase: function saveLabelsInDatabase(calculateProbabilityLabels, callback) {
          return nBF.saveLabelsInDatabase(calculateProbabilityLabels, callback);
        },
        saveWordsLabelsInDatabase: function saveWordsLabelsInDatabase(saveLabelsInDatabase, callback) {
          return nBF.saveWordsLabelsInDatabase(saveLabelsInDatabase, callback);
        }
      }, function (err, result) {
        if (err) throw err;
        socket.emit("addItem", {
          color: "green",
          text: "Finish",
          status: true
        }); //this.test();
      });
    }
  }, {
    key: "test",
    value: function test() {
      var datasetTest = this.datasetTest;
      async.autoInject({
        beginTest: function beginTest(callback) {
          return nBF.test({
            datasetTest: datasetTest
          }, callback);
        },
        getProbabilities: function getProbabilities(beginTest, callback) {
          return nBF.getProbabilities(beginTest, callback);
        }
      }, function (err, result) {
        if (err) throw err;
        console.log("finish");
      });
    }
  }, {
    key: "getDatasets",
    value: function getDatasets(idClient) {
      nBF.getDatasets(idClient);
    }
  }, {
    key: "setDefaultDataset",
    value: function setDefaultDataset(idClient, id) {
      nBF.setDefaultDataset(idClient, id);
    }
  }, {
    key: "prediction",
    value: function prediction(data) {
      nBF.prediction(data);
    }
  }]);

  return Naive_Bayes;
}();

exports.Naive_Bayes = Naive_Bayes;