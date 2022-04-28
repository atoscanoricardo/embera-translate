"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var fs = require("fs"); //const uuidv4 = require("uuid/v4");


var _require = require("uuid"),
    uuidv4 = _require.v4;

var mongoose = require("mongoose");

var Belief = require("../models/Belief");

var ProblemSpace = require("../models/Problem_Space");

var LearningDataset = require("../models/Learning_Dataset");

var Labels = require("../models/Labels");

var CellsDataset = require("../models/CellsDataset");

var _ = require("lodash");

var async = require("async");

var _require2 = require("./BaseBelief"),
    BaseBelief = _require2.BaseBelief;

var path = require("path");

var _require3 = require("./csv_functions"),
    CSVToArray = _require3.CSVToArray,
    checkDataset = _require3.checkDataset,
    extractLabelsAndDialogs = _require3.extractLabelsAndDialogs,
    extractTokens = _require3.extractTokens,
    generateBinary = _require3.generateBinary,
    getLabelsUniq = _require3.getLabelsUniq,
    fillWithFreq = _require3.fillWithFreq,
    getNBow = _require3.getNBow,
    getLabelsProbability = _require3.getLabelsProbability,
    extractTokensBydocument = _require3.extractTokensBydocument;

var NaiveBayesFunctions =
/*#__PURE__*/
function () {
  function NaiveBayesFunctions() {
    _classCallCheck(this, NaiveBayesFunctions);
  }

  _createClass(NaiveBayesFunctions, [{
    key: "uploadFileFromCsv",
    value: function uploadFileFromCsv(data, callback) {
      var datasetTemp = data.datasetTemp,
          socket = data.socket;

      var _this$generateName = this.generateName("../files/source/corpus"),
          filename = _this$generateName.filename,
          dir = _this$generateName.dir;

      socket.emit("addItem", {
        color: "green",
        text: "Inicializando datos. ".concat(datasetTemp.length, " registros"),
        status: true
      });
      data.socket = socket;
      data.filename = filename;
      data.dir = dir;
      callback(null, data);
    }
  }, {
    key: "createProblemSpace",
    value: function createProblemSpace(data, callback) {
      console.log("createProblemSpace");
      var idDocument = data.idDocument,
          filename = data.filename,
          socket = data.socket;
      var problemSpaceId = new mongoose.Types.ObjectId();
      data.problemSpaceId = problemSpaceId; // Si exixte adicionr learningDatasetId sino, crear uno nuevo

      ProblemSpace.findOne({
        idDocument: idDocument
      }, function (err, ps) {
        if (err) throw err;
        console.log(ps);

        if (ps == null) {
          ProblemSpace.insertMany({
            _id: problemSpaceId,
            name: "ps_".concat(filename),
            idDocument: idDocument
          }, function (err) {
            socket.emit("addItem", {
              color: "green",
              text: "Espacio de problema creado",
              status: true
            });
            callback(null, data);
          });
        } else {
          data.problemSpaceId = ps._id;
          callback(null, data);
        }
      });
    }
  }, {
    key: "createLearningDataset",
    value: function createLearningDataset(data, callback) {
      console.log("createLearningDataset");
      var self = this;
      var problemSpaceId = data.problemSpaceId,
          filename = data.filename,
          idDocument = data.idDocument,
          name = data.name,
          socket = data.socket;
      var learningDatasetId = new mongoose.Types.ObjectId();
      var version = 0;
      var description = "";
      data.learningDatasetId = learningDatasetId;
      LearningDataset.insertMany({
        _id: learningDatasetId,
        name: name,
        file: "lds_".concat(filename),
        version: version,
        description: description
      }, function (err) {
        console.log("Problem space ".concat(problemSpaceId)); //60876748b85430496c8ffac9

        ProblemSpace.updateOne({
          _id: problemSpaceId
        }, {
          $push: {
            has: learningDatasetId
          },
          idDocument: idDocument
        }, function (err, updated) {
          if (err) throw err;
          console.log("Updated ".concat(updated));
          socket.emit("addItem", {
            color: "green",
            text: "Creacion de dataset",
            status: true
          });
          callback(null, data);
        });
      });
    }
  }, {
    key: "prepareDocument",
    value: function prepareDocument(data, callback) {
      var dir, idDocument, datasetTemp, socket, labels, documents;
      return regeneratorRuntime.async(function prepareDocument$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              console.log("prepareDocument");
              dir = data.dir, idDocument = data.idDocument, datasetTemp = data.datasetTemp, socket = data.socket;
              labels = [], documents = [];
              _context.next = 5;
              return regeneratorRuntime.awrap(extractLabelsAndDialogs(checkDataset(datasetTemp), documents, labels));

            case 5:
              _context.next = 7;
              return regeneratorRuntime.awrap(documents);

            case 7:
              data.documents = _context.sent;
              _context.next = 10;
              return regeneratorRuntime.awrap(labels);

            case 10:
              data.labels = _context.sent;
              _context.next = 13;
              return regeneratorRuntime.awrap(getLabelsUniq(labels));

            case 13:
              data.labelsUniq = _context.sent;
              socket.emit("addItem", {
                color: "green",
                text: "Preparando documento",
                status: true
              });
              callback(null, data);

            case 16:
            case "end":
              return _context.stop();
          }
        }
      });
    }
  }, {
    key: "generateTokens",
    value: function generateTokens(data, callback) {
      console.log("Generate tokens");
      var documents = data.documents,
          idDocument = data.idDocument,
          sockets = data.sockets;
      var tokens = [];
      extractTokens(documents, tokens);
      data.tokens = _.compact(tokens);
      socket.emit("addItem", {
        color: "green",
        text: "Extrayendo tokens",
        status: true
      });
      callback(null, data);
    }
  }, {
    key: "generateIdsTokens",
    value: function generateIdsTokens(data, callback) {
      console.log("generateIdsTokens");
      var self = this;
      var tokens = data.tokens,
          idDocument = data.idDocument,
          socket = data.socket;
      var metas;
      var idsTokens = [];
      async.eachOfSeries(tokens, function (token, i, cbToken) {
        Belief.find({
          name: token
        }).select("name").exec(function (err, t) {
          if (err) throw err;

          if (t.length === 0) {
            var _id = new mongoose.Types.ObjectId();

            Belief.create(BaseBelief.getBeliefStructure({
              id: _id,
              name: token
            }), function (err, nBelief) {
              if (err) throw err;
              idsTokens.push({
                _id: _id,
                name: token
              });
              cbToken();
            });
          } else {
            idsTokens.push(t[0]);
            cbToken();
          }
        });
      }, function (err) {
        socket.emit("addItem", {
          color: "green",
          text: "Generando ids de tokens",
          status: true
        });
        callback(null, data);
        /*Belief.find({ name: /meta_[0-9]{1,2}_([0-9|a-z]{1,2})/ })
          .select("name")
          .exec((err, m) => {
            if (err) throw err;
            metas = m;
            data.metas = metas;
            data.idsTokens = idsTokens;
            socket.emit("addItem", {
              color: "green",
              text: `Recopilando datos`,
              status: true,
            });            
          });*/
      });
    }
  }, {
    key: "generateMatriz",
    value: function generateMatriz(data, callback) {
      var documents, tokens, idDocument, dataset;
      return regeneratorRuntime.async(function generateMatriz$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              console.log("generateCompactMatriz");
              documents = data.documents, tokens = data.tokens, idDocument = data.idDocument;
              socket.emit("addItem", {
                color: "green",
                text: "Generando dataset... Esto puede tardar varios minutos(muchos) dependendo del dataset",
                status: true
              });
              dataset = [];
              console.log("generateCompactBinary");
              _context2.next = 7;
              return regeneratorRuntime.awrap(generateBinary(documents, tokens, dataset));

            case 7:
              _context2.next = 9;
              return regeneratorRuntime.awrap(dataset);

            case 9:
              data.dataset = _context2.sent;
              socket.emit("addItem", {
                color: "green",
                text: "El dataset binario ha sido creado Cantidad de registros: [Dataset rows: ".concat(dataset.length, "] [Dataset cols:").concat(dataset[0].length, "]"),
                status: true
              });
              callback(null, data);

            case 12:
            case "end":
              return _context2.stop();
          }
        }
      });
    }
  }, {
    key: "calculateProbability",
    value: function calculateProbability(data, callback) {
      var _ref, tokens, dataset, labels, nLabels, nFeatures, labelsFrequency, nBow, pLabels;

      return regeneratorRuntime.async(function calculateProbability$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              console.log("calculateProbability");
              _context3.next = 3;
              return regeneratorRuntime.awrap(data);

            case 3:
              _ref = _context3.sent;
              tokens = _ref.tokens;
              dataset = _ref.dataset;
              labels = _ref.labels;
              _context3.next = 9;
              return regeneratorRuntime.awrap(labels.length);

            case 9:
              nLabels = _context3.sent;
              _context3.next = 12;
              return regeneratorRuntime.awrap(tokens.length);

            case 12:
              nFeatures = _context3.sent;
              labelsFrequency = {};
              nBow = {};
              pLabels = {};
              _context3.next = 18;
              return regeneratorRuntime.awrap(nFeatures);

            case 18:
              data.nFeatures = _context3.sent;
              _context3.next = 21;
              return regeneratorRuntime.awrap(fillWithFreq(labels, labelsFrequency));

            case 21:
              _context3.next = 23;
              return regeneratorRuntime.awrap(labelsFrequency);

            case 23:
              data.labelsFrequency = _context3.sent;
              _context3.next = 26;
              return regeneratorRuntime.awrap(getNBow(dataset, nBow, labels));

            case 26:
              _context3.next = 28;
              return regeneratorRuntime.awrap(nBow);

            case 28:
              data.nBow = _context3.sent;
              _context3.next = 31;
              return regeneratorRuntime.awrap(getLabelsProbability(labelsFrequency, nLabels, pLabels));

            case 31:
              _context3.next = 33;
              return regeneratorRuntime.awrap(pLabels);

            case 33:
              data.pLabels = _context3.sent;
              console.table(nBow);
              console.table(pLabels);
              socket.emit("addItem", {
                color: "green",
                text: "Calculandas las probailidades",
                status: true
              });
              callback(null, data);

            case 38:
            case "end":
              return _context3.stop();
          }
        }
      });
    }
  }, {
    key: "calculateProbabilityLabels",
    value: function calculateProbabilityLabels(data, callback) {
      console.log("calculateProbabilityLabels");
      var tokens = data.tokens,
          labelsUniq = data.labelsUniq,
          dataset = data.dataset,
          nBow = data.nBow,
          labels = data.labels;
      var acc = [];
      var nTokens = tokens.length;

      for (var j = 0; j < labelsUniq.length; j++) {
        var labelUnique = labelsUniq[j];
        var nks = Array(tokens.length).fill(0);

        var _loop = function _loop(i) {
          var label = labels[i];
          var binary = dataset[i];

          if (labelUnique == label) {
            nks = nks.map(function (a, k) {
              return a + binary[k];
            });
          }
        };

        for (var i = 0; i < dataset.length; i++) {
          _loop(i);
        }

        acc.push(nks);
      }

      data.nks = acc;
      var pwm = [];
      var nAcc = acc.length;

      for (var _i = 0; _i < nAcc; _i++) {
        var documents = acc[_i];
        var nAccI = documents.length;

        for (var _j = 0; _j < nAccI; _j++) {
          var token = documents[_j];

          if (nBow[labelsUniq[_i]] != undefined) {
            var P = (1 + token) / (nBow[labelsUniq[_i]] + nTokens);
            pwm.push({
              token: tokens[_j],
              label: labelsUniq[_i],
              P: P
            });
          }
        }
      }

      data.pwm = pwm;
      socket.emit("addItem", {
        color: "green",
        text: "Calculandas las probailidades de los labels",
        status: true
      });
      callback(null, data);
    }
  }, {
    key: "saveLabelsInDatabase",
    value: function saveLabelsInDatabase(data, callback) {
      console.log("saveLabelsInDatabase");
      var labels = data.labels,
          pLabels = data.pLabels,
          labelsUniq = data.labelsUniq,
          learningDatasetId = data.learningDatasetId;
      var newLabel = [];
      async.eachOfSeries(labelsUniq, function (label, i, cbLabel) {
        newLabel.push({
          _id: label,
          name: label,
          isA: "colDataset",
          learningDatasetId: learningDatasetId,
          has: {
            probability: pLabels[label]
          }
        });
        cbLabel();
      }, function (err) {
        if (err) throw err;
        async.eachOfSeries(newLabel, function (label, i, cbLabel) {
          console.log("saveLabelsInDatabase ".concat(i, " of ").concat(newLabel.length));
          Labels.find({
            _id: label._id
          }).exec(function (err, l) {
            if (err) throw err;

            if (l.length === 0) {
              Labels.create(label, function (err, lb) {
                if (err) throw err;
                cbLabel();
              });
            } else {
              cbLabel();
            }
          });
        }, function (err) {
          if (err) throw err;
          socket.emit("addItem", {
            color: "green",
            text: "Guardado labels en base de datos",
            status: true
          });
          callback(null, data);
        });
      });
    }
  }, {
    key: "saveWordsLabelsInDatabase",
    value: function saveWordsLabelsInDatabase(data, callback) {
      console.log("saveWordsLabelsInDatabase");
      var labels = data.labels,
          idsTokens = data.idsTokens,
          pwm = data.pwm,
          learningDatasetId = data.learningDatasetId,
          socket = data.socket;
      async.eachOfSeries(pwm, function (mt, i, cbmt) {
        if (_.find(labels, {
          name: mt.label
        }) != undefined && _.find(idsTokens, {
          name: mt.token
        }) != undefined) {
          CellsDataset.create({
            isA: "CellDataset",
            learningDatasetId: learningDatasetId,
            has: {
              head: _.find(labels, {
                name: mt.label
              })._id,
              field: _.find(idsTokens, {
                name: mt.token
              })._id,
              probability: mt.P
            }
          }, function (err, cd) {
            if (err) throw err;
            console.log("saveWordsLabelsInDatabase ".concat(i, " of ").concat(pwm.length));
            cbmt();
          });
        } else {
          cbmt();
        }
      }, function (err) {
        if (err) throw err;
        console.log("Save data...");
        socket.emit("addItem", {
          color: "green",
          text: "Guardando palabras calculadas en la base de datos",
          status: true
        });
        callback(null, data);
      });
    }
  }, {
    key: "test",
    value: function test(data, callback) {
      // crear flujo de procesos como en el otro codigo
      var datasetTest = data.datasetTest;
      var documentsTest = [];
      var labelsTest = [];
      var documentsTemp = [];

      for (var i = 0; i < datasetTest.length; i++) {
        documentsTemp.push(datasetTest[i][0]);
        labelsTest.push(datasetTest[i][1]);
      }

      extractTokensBydocument(documentsTemp, documentsTest);
      data.documentsTest = documentsTest;
      data.labelsTest = labelsTest;
      callback(null, data);
    }
  }, {
    key: "getProbabilities",
    value: function getProbabilities(data, callback) {
      var documentsTest = data.documentsTest,
          labelsTest = data.labelsTest;
      var docProbability = [];
      var acert = 0;
      var error = 0; //se obtienen todos los labels
      //Labels.find().exec((err, labels) => {
      //let labels_id = labels.map((l) => l._id);

      var labels_id = labelsTest; //se recorren los documentos a testear

      async.eachOfSeries(documentsTest, function (dt, i, cbDt) {
        console.log("[".concat(i, " of ").concat(documentsTest.length, "]"));

        var tokens = _.uniq(_.compact(dt)); //se buscan los tokens de cada documento


        Belief.find({
          name: {
            $in: tokens
          }
        }).select("name").exec(function (err, beliefs) {
          //console.table(beliefs);
          //beliefs.map(b => console.log(JSON.stringify(b)));
          if (err) throw err;
          var beliefs_id = beliefs.map(function (b) {
            return b._id;
          });
          var beliefs_name = beliefs.map(function (b) {
            return b.name;
          }); //console.table(beliefs_id);

          CellsDataset.find({
            "has.head": {
              $in: labels_id
            },
            "has.field": {
              $in: beliefs_id
            }
          }).populate({
            path: "has.field",
            select: "name"
          }).populate({
            path: "has.head",
            select: "name"
          }).exec(function _callee(err, celldata) {
            var dataByLabel, labelProbability, l, pM;
            return regeneratorRuntime.async(function _callee$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    if (!err) {
                      _context4.next = 2;
                      break;
                    }

                    throw err;

                  case 2:
                    _context4.next = 4;
                    return regeneratorRuntime.awrap(_.groupBy(celldata, "has.head.name"));

                  case 4:
                    dataByLabel = _context4.sent;
                    labelProbability = [];
                    _context4.t0 = regeneratorRuntime.keys(dataByLabel);

                  case 7:
                    if ((_context4.t1 = _context4.t0()).done) {
                      _context4.next = 17;
                      break;
                    }

                    l = _context4.t1.value;
                    _context4.next = 11;
                    return regeneratorRuntime.awrap(_.find(labels, {
                      name: l
                    }).has.probability);

                  case 11:
                    pM = _context4.sent;
                    _context4.next = 14;
                    return regeneratorRuntime.awrap(dataByLabel[l].map(function (dbl) {
                      pM *= dbl.has.probability;
                    }));

                  case 14:
                    labelProbability.push({
                      label: l,
                      p: pM
                    });
                    _context4.next = 7;
                    break;

                  case 17:
                    _context4.next = 19;
                    return regeneratorRuntime.awrap(docProbability.push([labelProbability, labelsTest[i]]));

                  case 19:
                    cbDt();

                  case 20:
                  case "end":
                    return _context4.stop();
                }
              }
            });
          });
        });
      }, function (err) {
        //                    _.orderBy(labelProbability, ["p"], ["desc"]),
        if (err) throw err; //console.log(JSON.stringify(docProbability));

        var total = docProbability.length;
        /*docProbability.map((dp, i) =>
            _.head(dp[0]).label === dp[1] ? acert++ : error++
          );*/
        //console.log(JSON.stringify(docProbability), init);

        docProbability.map(function (dp, i) {
          console.log(i, dp[1]);
          console.log(_.orderBy(dp[0], ["p"], ["desc"]));
        } //.map((l, j) =>console.log(l, dp[1]))
        );
        console.log("Finish test!");
        console.log("Acert: ".concat(acert, ", Error: ").concat(error, " Total: ").concat(total));
        callback(null, data);
      }); //});
    }
  }, {
    key: "prediction",
    value: function prediction(data) {
      var _this = this;

      var query = data.query,
          res = data.res; //let { descripcion, id } = req.body;

      async.autoInject({
        selecDatabase: function selecDatabase(callback) {
          return _this.selecDatabase(id, callback);
        },
        initCleanInterview: function initCleanInterview(selecDatabase, callback) {
          return _this.initCleanInterview(query, selecDatabase, callback);
        },
        getProbabilities: function getProbabilities(initCleanInterview, callback) {
          return _this.getProbabilities(initCleanInterview, callback);
        }
      }, function (err, result) {
        if (err) throw err;
        query.analisis = result.getProbabilities.analisis;
        res.status(200).json({
          query: query
        });
        console.log("finish");
      });
    }
  }, {
    key: "selecDatabase",
    value: function selecDatabase(id, callback) {
      var _this2 = this;

      var data = {};
      var query = id != undefined ? {
        _id: id
      } : {
        isSelected: true
      };
      Learning_Dataset.find(query).exec(function (error, dataset) {
        if (error) throw error;

        if (dataset.length == 0) {
          console.log("No hay dataset seleccionado");
        } else {
          _this2.dataset = dataset[0];
          data.dataset = dataset[0];
          callback(null, data);
        }
      });
    }
  }, {
    key: "initCleanInterview",
    value: function initCleanInterview(descripcion, data, callback) {
      data.interview = clearInterview(descripcion);
      callback(null, data);
    }
  }, {
    key: "getProbabilities",
    value: function getProbabilities(data, callback) {
      var dataset = data.dataset,
          interview = data.interview;
      Labels.find({
        learningDatasetId: dataset._id
      }).exec(function (err, labels) {
        // se debe corregir para futura version que el name del label no sea unico o que el LearningDatasetId sea un campo array de ids
        var labels_id = labels.map(function (l) {
          return l._id;
        });
        var tokens = interview; //se buscan los tokens de cada documento

        Belief.find({
          name: {
            $in: tokens
          }
        }).select("name").exec(function (err, beliefs) {
          if (err) throw err;
          var beliefs_id = beliefs.map(function (b) {
            return b._id;
          });
          var beliefs_name = beliefs.map(function (b) {
            return b.name;
          });
          CellsDataset.find({
            learningDatasetId: dataset._id,
            "has.head": {
              $in: labels_id
            },
            "has.field": {
              $in: beliefs_id
            }
          }).populate({
            path: "has.field",
            select: "name"
          }).populate({
            path: "has.head",
            select: "name"
          }).exec(function _callee2(err, celldata) {
            var dataByLabel, labelProbability, l, pM;
            return regeneratorRuntime.async(function _callee2$(_context5) {
              while (1) {
                switch (_context5.prev = _context5.next) {
                  case 0:
                    console.log(celldata.length);

                    if (!err) {
                      _context5.next = 3;
                      break;
                    }

                    throw err;

                  case 3:
                    _context5.next = 5;
                    return regeneratorRuntime.awrap(_.groupBy(celldata, "has.head.name"));

                  case 5:
                    dataByLabel = _context5.sent;
                    labelProbability = [];
                    _context5.t0 = regeneratorRuntime.keys(dataByLabel);

                  case 8:
                    if ((_context5.t1 = _context5.t0()).done) {
                      _context5.next = 18;
                      break;
                    }

                    l = _context5.t1.value;
                    _context5.next = 12;
                    return regeneratorRuntime.awrap(_.find(labels, {
                      name: l
                    }).has.probability);

                  case 12:
                    pM = _context5.sent;
                    _context5.next = 15;
                    return regeneratorRuntime.awrap(dataByLabel[l].map(function (dbl) {
                      pM *= dbl.has.probability;
                    }));

                  case 15:
                    labelProbability.push({
                      label: l,
                      p: pM
                    });
                    _context5.next = 8;
                    break;

                  case 18:
                    _context5.next = 20;
                    return regeneratorRuntime.awrap(_.orderBy(labelProbability, ["p"], ["desc"]).slice(0, 10));

                  case 20:
                    data.analisis = _context5.sent;
                    callback(null, data);

                  case 22:
                  case "end":
                    return _context5.stop();
                }
              }
            });
          });
        });
      });
    }
    /** General functions */

  }, {
    key: "addReport",
    value: function addReport(params) {
      var id = params.id;
      this.reportSoket[id] = params;
      app_users[params.idDocument].emit("statusProcess", this.reportSoket);
    }
  }, {
    key: "generateName",
    value: function generateName() {
      var dir = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var filename = "corpus_".concat(uuidv4(), ".csv");
      dir = dir != null ? path.join(__dirname, dir, filename) : "".concat(dir, "/").concat(filename);
      return {
        dir: dir,
        filename: filename
      };
    }
  }, {
    key: "getDatasets",
    value: function getDatasets(idDocument) {
      LearningDataset.find().exec(function (err, datasets) {
        if (err) throw err;
        app_users[idDocument].emit("getDatasets", {
          datasets: datasets
        });
      });
    }
  }, {
    key: "setDefaultDataset",
    value: function setDefaultDataset(idDocument, id) {
      LearningDataset.updateMany({}, {
        $set: {
          isSelected: false
        }
      }).exec(function (err, updates) {
        LearningDataset.updateOne({
          _id: id
        }, {
          isSelected: true
        }).exec(function (err, datasets) {
          if (err) throw err;
          app_users[idDocument].emit("getDatasets", {
            datasets: datasets
          });
        });
      });
    }
  }]);

  return NaiveBayesFunctions;
}();

exports.nBF = new NaiveBayesFunctions();