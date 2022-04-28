var { npl } = require("../lib/NPLRegex");
//const uuidv4 = require("uuid");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
var _ = require("lodash");
var { nBF } = require("./Naive_Bayes_Functions");
var async = require("async");
class Naive_Bayes {
  constructor() {
    this.datasetTest = [];
  }

  processData(data) {
    let { socket } = data;

    async.autoInject(
      {
        uploadFileFromCsv: (callback) => nBF.uploadFileFromCsv(data, callback),
        createProblemSpace: (uploadFileFromCsv, callback) =>
          nBF.createProblemSpace(uploadFileFromCsv, callback),
        createLearningDataset: (createProblemSpace, callback) =>
          nBF.createLearningDataset(createProblemSpace, callback),
        prepareDocument: (createLearningDataset, callback) =>
          nBF.prepareDocument(createLearningDataset, callback),
        generateTokens: (prepareDocument, callback) =>
          nBF.generateTokens(prepareDocument, callback),
        generateIdsTokens: (generateTokens, callback) =>
          nBF.generateIdsTokens(generateTokens, callback),
        generateMatriz: (generateIdsTokens, callback) =>
          nBF.generateMatriz(generateIdsTokens, callback),
        calculateProbability: (generateMatriz, callback) =>
          nBF.calculateProbability(generateMatriz, callback),
        calculateProbabilityLabels: (calculateProbability, callback) =>
          nBF.calculateProbabilityLabels(calculateProbability, callback),
        saveLabelsInDatabase: (calculateProbabilityLabels, callback) =>
          nBF.saveLabelsInDatabase(calculateProbabilityLabels, callback),
        saveWordsLabelsInDatabase: (saveLabelsInDatabase, callback) =>
          nBF.saveWordsLabelsInDatabase(saveLabelsInDatabase, callback),
      },
      (err, result) => {
        if (err) throw err;
        socket.emit("addItem", {
          color: "green",
          text: `Finish`,
          status: true,
        });
        //this.test();
      }
    );
  }

  test() {
    var datasetTest = this.datasetTest;
    async.autoInject(
      {
        beginTest: (callback) => nBF.test({ datasetTest }, callback),
        getProbabilities: (beginTest, callback) =>
          nBF.getProbabilities(beginTest, callback),
      },
      (err, result) => {
        if (err) throw err;
        console.log("finish");
      }
    );
  }

  getDatasets(idClient) {
    nBF.getDatasets(idClient);
  }

  setDefaultDataset(idClient, id) {
    nBF.setDefaultDataset(idClient, id);
  }

  prediction(data) {
    nBF.prediction(data);
  }
}

exports.Naive_Bayes = Naive_Bayes;
