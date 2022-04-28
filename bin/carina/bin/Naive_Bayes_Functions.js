const fs = require("fs");
//const uuidv4 = require("uuid/v4");
const { v4: uuidv4 } = require("uuid");
var mongoose = require("mongoose");
var Belief = require("../models/Belief");
var ProblemSpace = require("../models/Problem_Space");
var LearningDataset = require("../models/Learning_Dataset");
var Labels = require("../models/Labels");
var CellsDataset = require("../models/CellsDataset");
var Articulo = require("../models/Articulo");
var _ = require("lodash");
var async = require("async");
const { BaseBelief } = require("./BaseBelief");
var path = require("path");

var {
  CSVToArray,
  checkDataset,
  extractLabelsAndDialogs,
  extractTokens,
  generateBinary,
  getLabelsUniq,
  fillWithFreq,
  getNBow,
  getLabelsProbability,
  extractTokensBydocument,
  clearInterview,
} = require("./csv_functions");

class NaiveBayesFunctions {
  constructor() {}
  uploadFileFromCsv(data, callback) {
    let { datasetTemp, socket } = data;
    let { filename, dir } = this.generateName("../files/source/corpus");
    socket.emit("addItem", {
      color: "green",
      text: `Inicializando datos. ${datasetTemp.length} registros`,
      status: true,
    });
    data.socket = socket;
    data.filename = filename;
    data.dir = dir;
    callback(null, data);
  }

  createProblemSpace(data, callback) {
    console.log("createProblemSpace");
    let { idDocument, filename, socket } = data;
    let problemSpaceId = new mongoose.Types.ObjectId();
    data.problemSpaceId = problemSpaceId;
    // Si exixte adicionr learningDatasetId sino, crear uno nuevo
    ProblemSpace.findOne({ idDocument: idDocument }, (err, ps) => {
      if (err) throw err;
      console.log(ps);
      if (ps == null) {
        ProblemSpace.insertMany(
          {
            _id: problemSpaceId,
            name: `ps_${filename}`,
            idDocument: idDocument,
          },
          (err) => {
            socket.emit("addItem", {
              color: "green",
              text: `Espacio de problema creado`,
              status: true,
            });
            callback(null, data);
          }
        );
      } else {
        data.problemSpaceId = ps._id;
        callback(null, data);
      }
    });
  }

  createLearningDataset(data, callback) {
    console.log("createLearningDataset");
    let self = this;
    let { problemSpaceId, filename, idDocument, name, socket } = data;
    let learningDatasetId = new mongoose.Types.ObjectId();
    let version = 0;
    let description = "";
    data.learningDatasetId = learningDatasetId;
    LearningDataset.insertMany(
      {
        _id: learningDatasetId,
        name: name,
        file: `lds_${filename}`,
        version: version,
        description: description,
      },
      function (err) {
        console.log(`Problem space ${problemSpaceId}`); //60876748b85430496c8ffac9
        ProblemSpace.updateOne(
          { _id: problemSpaceId },
          {
            $push: {
              has: learningDatasetId,
            },
            idDocument: idDocument,
          },
          (err, updated) => {
            if (err) throw err;
            console.log(`Updated ${updated}`);
            socket.emit("addItem", {
              color: "green",
              text: `Creacion de dataset`,
              status: true,
            });
            callback(null, data);
          }
        );
      }
    );
  }

  async prepareDocument(data, callback) {
    console.log("prepareDocument");
    let { dir, idDocument, datasetTemp, socket } = data;
    let labels = [],
      documents = [];
    await extractLabelsAndDialogs(checkDataset(datasetTemp), documents, labels);

    data.documents = await documents;
    data.labels = await labels;
    data.labelsUniq = await getLabelsUniq(labels);
    socket.emit("addItem", {
      color: "green",
      text: `Preparando documento`,
      status: true,
    });
    callback(null, data);
  }

  generateTokens(data, callback) {
    console.log(`Generate tokens`);
    let { documents, idDocument, sockets } = data;
    let tokens = [];
    extractTokens(documents, tokens);
    data.tokens = _.compact(tokens);
    socket.emit("addItem", {
      color: "green",
      text: `Extrayendo tokens`,
      status: true,
    });
    callback(null, data);
  }

  generateIdsTokens(data, callback) {
    console.log("generateIdsTokens");
    let self = this;
    let { tokens, idDocument, socket } = data;

    let metas;
    let idsTokens = [];

    async.eachOfSeries(
      tokens,
      (token, i, cbToken) => {
        Belief.find({ name: token })
          .select("name")
          .exec((err, t) => {
            if (err) throw err;

            if (t.length === 0) {
              let id = new mongoose.Types.ObjectId();
              Belief.create(
                BaseBelief.getBeliefStructure({ id: id, name: token }),
                function (err, nBelief) {
                  if (err) throw err;
                  idsTokens.push({ _id: id, name: token });
                  cbToken();
                }
              );
            } else {
              idsTokens.push(t[0]);
              cbToken();
            }
          });
      },
      (err) => {
        socket.emit("addItem", {
          color: "green",
          text: `Generando ids de tokens`,
          status: true,
        });
        data.idsTokens = idsTokens;
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
      }
    );
  }

  async generateMatriz(data, callback) {
    console.log("generateCompactMatriz");
    let { documents, tokens, idDocument } = data;
    socket.emit("addItem", {
      color: "green",
      text: `Generando dataset... Esto puede tardar varios minutos(muchos) dependendo del dataset`,
      status: true,
    });

    let dataset = [];
    console.log("generateCompactBinary");
    await generateBinary(documents, tokens, dataset);
    data.dataset = await dataset;
    socket.emit("addItem", {
      color: "green",
      text: `El dataset binario ha sido creado Cantidad de registros: [Dataset rows: ${dataset.length}] [Dataset cols:${dataset[0].length}]`,
      status: true,
    });

    callback(null, data);
  }

  async calculateProbability(data, callback) {
    console.log("calculateProbability");
    let { tokens, dataset, labels } = await data;
    let nLabels = await labels.length;
    let nFeatures = await tokens.length;
    let labelsFrequency = {};
    let nBow = {};
    let pLabels = {};
    data.nFeatures = await nFeatures;
    await fillWithFreq(labels, labelsFrequency);
    data.labelsFrequency = await labelsFrequency;
    await getNBow(dataset, nBow, labels);
    data.nBow = await nBow;

    await getLabelsProbability(labelsFrequency, nLabels, pLabels);

    data.pLabels = await pLabels;
    //console.table(nBow);
    //console.table(pLabels);

    socket.emit("addItem", {
      color: "green",
      text: `Calculandas las probailidades`,
      status: true,
    });

    callback(null, data);
  }

  calculateProbabilityLabels(data, callback) {
    console.log("calculateProbabilityLabels");
    let { tokens, labelsUniq, dataset, nBow, labels } = data;

    let acc = [];
    let nTokens = tokens.length;
    for (let j = 0; j < labelsUniq.length; j++) {
      let labelUnique = labelsUniq[j];
      let nks = Array(tokens.length).fill(0);

      for (let i = 0; i < dataset.length; i++) {
        let label = labels[i];
        let binary = dataset[i];
        if (labelUnique == label) {
          nks = nks.map((a, k) => a + binary[k]);
        }
      }
      acc.push(nks);
    }

    data.nks = acc;

    let pwm = [];
    let nAcc = acc.length;
    for (let i = 0; i < nAcc; i++) {
      let documents = acc[i];
      let nAccI = documents.length;
      for (let j = 0; j < nAccI; j++) {
        let token = documents[j];
        if (nBow[labelsUniq[i]] != undefined) {
          let P = (1 + token) / (nBow[labelsUniq[i]] + nTokens);
          pwm.push({
            token: tokens[j],
            label: labelsUniq[i],
            P: P,
          });
        }
      }
    }
    data.pwm = pwm;
    socket.emit("addItem", {
      color: "green",
      text: `Calculandas las probailidades de los labels`,
      status: true,
    });

    callback(null, data);
  }

  saveLabelsInDatabase(data, callback) {
    console.log("saveLabelsInDatabase");
    let { labels, pLabels, labelsUniq, learningDatasetId } = data;
    let newLabel = [];
    async.eachOfSeries(
      labelsUniq,
      (label, i, cbLabel) => {
        newLabel.push({
          _id: label,
          name: label,
          isA: "colDataset",
          learningDatasetId: learningDatasetId,
          has: {
            probability: pLabels[label],
          },
        });

        cbLabel();
      },
      (err) => {
        if (err) throw err;
        //console.log(newLabel);
        async.eachOfSeries(
          newLabel,
          (label, i, cbLabel) => {
            console.log(`saveLabelsInDatabase ${i} of ${newLabel.length}`);
            Labels.find({ _id: label._id }).exec((err, l) => {
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
          },
          (err) => {
            if (err) throw err;
            socket.emit("addItem", {
              color: "green",
              text: `Guardado labels en base de datos`,
              status: true,
            });
            callback(null, data);
          }
        );
      }
    );
  }

  saveWordsLabelsInDatabase(data, callback) {
    console.log("saveWordsLabelsInDatabase");
    let { labels, idsTokens, pwm, learningDatasetId, socket } = data;

    async.eachOfSeries(
      pwm,
      (mt, i, cbmt) => {
        if (
          mt.label != undefined &&
          _.find(idsTokens, { name: mt.token }) != undefined
        ) {
          CellsDataset.create(
            {
              isA: "CellDataset",
              learningDatasetId: learningDatasetId,
              has: {
                head: mt.label,
                field: _.find(idsTokens, { name: mt.token })._id,
                probability: mt.P,
              },
            },
            function (err, cd) {
              if (err) throw err;
              console.log(`saveWordsLabelsInDatabase ${i} of ${pwm.length}`);
              cbmt();
            }
          );
        } else {
          cbmt();
        }
      },
      (err) => {
        if (err) throw err;
        console.log("Save data...");

        socket.emit("addItem", {
          color: "green",
          text: `Guardando palabras calculadas en la base de datos`,
          status: true,
        });
        callback(null, data);
      }
    );
  }

  test(data, callback) {
    // crear flujo de procesos como en el otro codigo
    let { datasetTest } = data;
    let documentsTest = [];
    let labelsTest = [];
    let documentsTemp = [];
    for (let i = 0; i < datasetTest.length; i++) {
      documentsTemp.push(datasetTest[i][0]);
      labelsTest.push(datasetTest[i][1]);
    }

    extractTokensBydocument(documentsTemp, documentsTest);
    data.documentsTest = documentsTest;
    data.labelsTest = labelsTest;
    callback(null, data);
  }

  getProbabilities(data, callback) {
    let { documentsTest, labelsTest } = data;
    let docProbability = [];
    let acert = 0;
    let error = 0;
    //se obtienen todos los labels
    //Labels.find().exec((err, labels) => {
    //let labels_id = labels.map((l) => l._id);
    let labels_id = labelsTest;

    //se recorren los documentos a testear
    async.eachOfSeries(
      documentsTest,
      (dt, i, cbDt) => {
        console.log(`[${i} of ${documentsTest.length}]`);

        let tokens = _.uniq(_.compact(dt));
        //se buscan los tokens de cada documento

        Belief.find({ name: { $in: tokens } })
          .select("name")
          .exec((err, beliefs) => {
            //console.table(beliefs);
            //beliefs.map(b => console.log(JSON.stringify(b)));
            if (err) throw err;

            let beliefs_id = beliefs.map((b) => b._id);
            let beliefs_name = beliefs.map((b) => b.name);
            //console.table(beliefs_id);
            CellsDataset.find({
              "has.head": { $in: labels_id },
              "has.field": { $in: beliefs_id },
            })
              .populate({
                path: "has.field",
                select: "name",
              })
              .populate({
                path: "has.head",
                select: "name",
              })
              .exec(async (err, celldata) => {
                if (err) throw err;
                let dataByLabel = await _.groupBy(celldata, "has.head.name");

                let labelProbability = [];
                for (let l in dataByLabel) {
                  let pM = await _.find(labels, {
                    name: l,
                  }).has.probability;

                  await dataByLabel[l].map((dbl) => {
                    pM *= dbl.has.probability;
                  });
                  labelProbability.push({ label: l, p: pM });
                }
                await docProbability.push([labelProbability, labelsTest[i]]);

                cbDt();
              });
          });
      },
      (err) => {
        //                    _.orderBy(labelProbability, ["p"], ["desc"]),
        if (err) throw err;
        //console.log(JSON.stringify(docProbability));
        let total = docProbability.length;
        /*docProbability.map((dp, i) =>
            _.head(dp[0]).label === dp[1] ? acert++ : error++
          );*/
        //console.log(JSON.stringify(docProbability), init);
        docProbability.map(
          (dp, i) => {
            console.log(i, dp[1]);
            console.log(_.orderBy(dp[0], ["p"], ["desc"]));
          } //.map((l, j) =>console.log(l, dp[1]))
        );

        console.log("Finish test!");
        console.log(`Acert: ${acert}, Error: ${error} Total: ${total}`);
        callback(null, data);
      }
    );
    //});
  }

  prediction(data) {
    let { query, res } = data;
    //let { descripcion, id } = req.body;
    async.autoInject(
      {
        selecDatabase: (callback) => this.selecDatabase(data, callback),
        initCleanInterview: (selecDatabase, callback) =>
          this.initCleanInterview(selecDatabase, callback),
        getProbabilities: (initCleanInterview, callback) =>
          this.getProbabilities(initCleanInterview, callback),
      },
      (err, result) => {
        if (err) throw err;
        let analisis = result.getProbabilities.analisis;

        Articulo.find({ _id: analisis.map((a) => a.label) }).exec(function (
          err,
          articulos
        ) {
          console.log(articulos);
          res.status(200).json({ analisis, articulos });
          console.log("finish");
        });
      }
    );
  }

  selecDatabase(data, callback) {
    let { idDataset } = data;

    // let _id = idDataset != undefined ? { _id: idDataset } : { isSelected: true };
    LearningDataset.findOne({ _id: idDataset }).exec((error, dataset) => {
      if (error) throw error;

      if (dataset == null) {
        console.log("No hay dataset seleccionado");
      } else {
        this.dataset = dataset;
        data.dataset = dataset;
        callback(null, data);
      }
    });
  }

  initCleanInterview(data, callback) {
    let { query } = data;
    data.interview = clearInterview(query);
    callback(null, data);
  }

  getProbabilities(data, callback) {
    let { dataset, interview } = data;
    Labels.find({ learningDatasetId: dataset._id }).exec((err, labels) => {
      // se debe corregir para futura version que el name del label no sea unico o que el LearningDatasetId sea un campo array de ids
      let labels_id = labels.map((l) => l._id);
      let tokens = interview;
      //se buscan los tokens de cada documento
      Belief.find({ name: { $in: tokens } })
        .select("name")
        .exec((err, beliefs) => {
          if (err) throw err;

          let beliefs_id = beliefs.map((b) => b._id);
          let beliefs_name = beliefs.map((b) => b.name);

          CellsDataset.find({
            learningDatasetId: dataset._id,
            "has.head": { $in: labels_id },
            "has.field": { $in: beliefs_id },
          })
            .populate({
              path: "has.field",
              select: "name",
            })
            .populate({
              path: "has.head",
              select: "name",
            })
            .exec(async (err, celldata) => {
              console.log(celldata.length);
              if (err) throw err;
              let dataByLabel = await _.groupBy(celldata, "has.head.name");

              let labelProbability = [];
              for (let l in dataByLabel) {
                let pM = await _.find(labels, {
                  name: l,
                }).has.probability;

                await dataByLabel[l].map((dbl) => {
                  pM *= dbl.has.probability;
                });
                labelProbability.push({ label: l, p: pM });
              }

              data.analisis = await _.orderBy(
                labelProbability,
                ["p"],
                ["desc"]
              ).slice(0, 10);

              callback(null, data);
            });
        });
    });
  }

  /** General functions */

  addReport(params) {
    let { id } = params;
    this.reportSoket[id] = params;
    app_users[params.idDocument].emit("statusProcess", this.reportSoket);
  }

  generateName(dir = null) {
    let filename = `corpus_${uuidv4()}.csv`;
    dir =
      dir != null ? path.join(__dirname, dir, filename) : `${dir}/${filename}`;
    return { dir: dir, filename: filename };
  }

  getDatasets(idDocument) {
    LearningDataset.find().exec((err, datasets) => {
      if (err) throw err;
      app_users[idDocument].emit("getDatasets", { datasets: datasets });
    });
  }

  setDefaultDataset(idDocument, id) {
    LearningDataset.updateMany({}, { $set: { isSelected: false } }).exec(
      (err, updates) => {
        LearningDataset.updateOne(
          { _id: id },
          {
            isSelected: true,
          }
        ).exec((err, datasets) => {
          if (err) throw err;
          app_users[idDocument].emit("getDatasets", { datasets: datasets });
        });
      }
    );
  }
}

exports.nBF = new NaiveBayesFunctions();
