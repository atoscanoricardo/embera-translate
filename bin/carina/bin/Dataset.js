var async = require("async");
var Belief = require("../models/Belief");
var _ = require("lodash");
var { ProcessData: CProcessData } = require("./ProcessData");
var Token = require("../models/Token");
var Corpus = require("../models/Corpus");
var { Naive_Bayes } = require("./Naive_Bayes");
var { npl } = require("../lib/NPLRegex");
var { ProcessWord: CProcessWord } = require("./ProcessWord");
//const uuidv4 = require("uuid/v4");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { BaseBelief } = require("./BaseBelief");
const mongoose = require("mongoose");

class Dataset {
  constructor() {
    this.pd = new CProcessData();
    this.nb = new Naive_Bayes();
    this.pw = new CProcessWord();
  }

  loadDocumentInput(req, res) {
    let rowsByMetas = [];
    let { filename, docs } = req.body;
    let document = 0;
    async.eachOfSeries(
      docs,
      (doc, kDoc, cbDoc) => {
        let input = doc.input;
        let suma_unos_de_features = 0;
        for (const valor in input) {
          suma_unos_de_features += Number(input[valor]);
        }

        rowsByMetas.push({
          document: document,
          input: input,
          labelSDG: doc.labelSDG,
          filename: filename,
          suma_unos_de_features: suma_unos_de_features,
        });
        document++;
        cbDoc();
      },
      (err) => {
        Corpus.insertMany(rowsByMetas, (err, result) => {
          if (err) throw err;
          res.send({ result: result });
        });
      }
    );
  }

  tokensPreseleccionados(i, p, fn) {
    async.autoInject(
      {
        getTokensSelected: (callback) => {
          this.pd.getTokensSelected(i, p, fn, callback);
        },
      },
      async (err, result) => {
        let headers = await [
          { text: "Token", value: "token" },
          { text: "Lemma", value: "lemma" },
        ];
        let tokens = await result.getTokensSelected;
        let data = await { headers: headers, tokens: tokens };
        await socket.emit("tokensPreselected", data);
      }
    );
  }

  tokensEliminados(i, p, fn) {
    async.autoInject(
      {
        getTokensEliminados: (callback) => {
          this.pd.getTokensEliminados(i, p, fn, callback);
        },
      },
      async (err, result) => {
        let headers = await [
          { text: "Token", value: "token" },
          { text: "Lemma", value: "lemma" },
        ];
        let tokens = await result.getTokensEliminados;
        let data = await { headers: headers, tokens: tokens };
        await socket.emit("tokensDeselected", data);
      }
    );
  }

  tokensSeleccionados(i, p, fn) {
    async.autoInject(
      {
        getTokensSelected: (callback) => {
          this.pd.getTokensFinales(i, p, fn, callback);
        },
      },
      async (err, result) => {
        let headers = await [
          { text: "Token", value: "token" },
          { text: "Lemma", value: "lemma" },
        ];
        let tokens = await result.getTokensSelected;
        let data = await { headers: headers, tokens: tokens };
        await socket.emit("tokensSelected", data);
      }
    );
  }

  saveTokensPreseleccionados(selected) {
    async.eachOfSeries(
      selected,
      (row, kRow, cbRow) => {
        Token.updateMany({ _id: row._id }, row, { multi: true }).exec(
          (err, tokens) => {
            cbRow();
            if (err) throw err;
          }
        );
      },
      (err) => {
        socket.emit("tokensUpdated", { update: true });
      }
    );
  }

  saveTokensEliminados(selected) {
    async.eachOfSeries(
      selected,
      (row, kRow, cbRow) => {
        Token.updateMany({ _id: row._id }, row, { multi: true }).exec(
          (err, tokens) => {
            cbRow();
            if (err) throw err;
          }
        );
      },
      (err) => {
        socket.emit("tokensUpdated", { update: true });
      }
    );
  }

  saveTokensSeleccionados(selected) {
    async.eachOfSeries(
      selected,
      (row, kRow, cbRow) => {
        Token.updateMany({ _id: row._id }, row, { multi: true }).exec(
          (err, tokens) => {
            cbRow();
            if (err) throw err;
          }
        );
      },
      (err) => {
        socket.emit("tokensUpdated", { update: true });
      }
    );
  }

  async totalElements(fn) {
    await this.pd.totalElements(fn, io);
  }

  getMatrix(filename) {
    fs.writeFile(path.join(__dirname, `matriz.csv`), "", (err) => {});
    Corpus.find({
      filename: filename,
      labelSDG: { $ne: "" },
      document: { $ne: "" },
    })
      //.select("input labelSDG")
      //.skip(1)
      .limit(20)
      //.sort([["document", 1]])
      .exec(async (err, matrix) => {
        let result = {};
        if (err) throw err;
        if (matrix.length != 0) {
          await matrix.map(async (m) => {
            let { input, labelSDG, suma_unos_de_features } = await m;
            await _.set(result, `doc${m.document}`, {
              suma_unos_de_features: suma_unos_de_features,
              input: input,
              labelSDG: labelSDG,
            });
          });
          await fs.appendFile(
            path.join(__dirname, `matriz.csv`),
            `${JSON.stringify(result)}\n`,
            (err) => {
              if (err) throw err;
              this.nb.filename = filename;
              this.nb.init(result);
            }
          );
        }
      });
  }

  loadDatabaseCsv(req, res) {
    //this.pw.socket = io;
    this.pw.init(req.body, req.params);
    res.send({ status: 200, enviado: true });
  }

  getBeliefFromWord(req) {
    let { palabras, idClient } = req.body;
    let words = [];
    palabras
      .toLowerCase()
      .split(",")
      .map((w) => {
        words.push(npl.clearSpaceOnInitWord(w));
      });

    Belief.find({
      name: { $in: words },
    })
      .select("name attributes.meronym")
      .populate({
        path:
          "attributes.holonym attributes.hyponym attributes.synonym attributes.holonym attributes.antonym attributes.meronym has.lema isA",
        model: "Belief",
        select: "name",
      })
      .populate({
        path: "isPartCompoundWord isA",
        model: "Belief",
        select: "name",
      })
      .exec((err, beliefs) => {
        if (err) throw err;
        app_users[idClient].emit("getBeliefFromWord", beliefs);
      });
  }

  getMetas(idClient) {
    Belief.find({
      name: /^meta_([0-9]|[0-9][0-9])_([0-9]|[0-9][0-9])$/,
    }).exec((err, metas) => {
      if (err) throw err;
      let labels = [];
      metas.map((m) => labels.push(m.name));
      app_users[idClient].emit("getMetas", { metas: metas, labels: labels });
    });
  }

  async updateBelief(data) {
    let idClient = data.params.idClient;
    let bToUpdate = data.body;
    let holonym = [];
    await bToUpdate.attributes.holonym.forEach((h) => holonym.push(h._id));

    Belief.find({ _id: bToUpdate._id }).exec((err, belief) => {
      let idHolonym = belief[0].attributes.holonym;
      let idRemove = _.difference(idHolonym, holonym);
      let idAdd = _.difference(holonym, idHolonym);

      Belief.updateMany({ _id: bToUpdate._id }, bToUpdate).exec(
        (err, bUpdate) => {
          Belief.updateMany(
            { _id: { $in: idRemove } },
            { $pull: { "attributes.meronym": bToUpdate._id } },
            { multi: true }
          ).exec((err, deleted) => {
            Belief.updateMany(
              { _id: { $in: idAdd } },
              { $push: { "attributes.meronym": bToUpdate._id } },
              { multi: true }
            ).exec((err, added) => {
              app_users[idClient].emit("beliefUpdated", bUpdate);
            });
          });
        }
      );
    });
  }

  generateBackup(req) {
    console.log("Download");
    let idClient = req.params.idClient;
    let filename = `backup_db_${Date.now()}_${uuidv4()}.csv`;
    let pathBackup = path.join(__dirname, "..", "uploads", filename);

    Belief.find({}, (err, beliefs) => {
      if (err) throw err;

      fs.writeFile(pathBackup, JSON.stringify(beliefs), function (err) {
        if (err) throw err;
        app_users[idClient].emit("generateBackup", { filename: filename });
        console.log(filename);
      });
    });
  }

  saveNewWord(req) {
    let { idClient } = req.params;
    let { words, holonym } = req.body;
    let report = [];
    async.eachOfSeries(
      words,
      (word, kWord, cbWord) => {
        word = npl.clearSpaceOnInitWord(word);
        word = npl.clearSpaceOnEndWord(word);
        word = word.toLowerCase();

        Belief.find({ name: word }).exec((err, belief) => {
          var isNgram = word.split(" ").length > 1 ? true : false;

          if (belief.length == 0) {
            let id = new mongoose.Types.ObjectId();
            let beliefStructure = BaseBelief.getBeliefStructure({
              name: word,
              id: id,
            });

            Belief.updateMany(
              { name: { $in: holonym } },
              { $addToSet: { "attributes.meronym": id } },
              { multi: true }
            ).exec((err, updates) => {
              Belief.find({ name: { $in: holonym } })
                .select("_id")
                .exec(async (err, metas) => {
                  beliefStructure.attributes.holonym = metas;
                  if (isNgram) {
                    let arrName = await word.split(" ");
                    //buscar palabras y decirles que hacen parte de la palabra con id arrOrderedIndex
                    var bulkOps = await [];
                    await arrName.map((name) =>
                      bulkOps.push({
                        updateOne: {
                          filter: { name: name },
                          update: {
                            /*$addToSet: {
                              isPartCompoundWord: id // no es un id, es un arra de los id que componen a la palabra
                            },*/
                            $set: { isPartOfCompoundWord: true },
                          },
                          upsert: true,
                        },
                      })
                    );

                    await Belief.bulkWrite(bulkOps)
                      .then((updated) => {
                        Belief.find({ name: { $in: arrName } })
                          .select("_id")
                          .exec((err, getIds) => {
                            let ids = _.concat(
                              //no es necesario, eliminar a futuro
                              _.values(updated.upsertedIds),
                              _.values(getIds)
                            );

                            Belief.find({ _id: { $in: ids } }, "_id name").exec(
                              (err, ids) => {
                                let arrOrderedIndex = [];

                                arrName.forEach((wOrdered, i, arrName) => {
                                  arrOrderedIndex[i] = ids.find(
                                    (k) => k.name == wOrdered
                                  )._id;
                                });

                                beliefStructure.compounddWord = arrOrderedIndex;

                                Belief.create(beliefStructure, (err, b) => {
                                  if (err) throw err;
                                  Belief.updateMany(
                                    { name: { $in: arrName } },
                                    {
                                      $addToSet: {
                                        isPartCompoundWord: arrOrderedIndex,
                                      },
                                    },
                                    { multi: true }
                                  ).exec((err) => {
                                    cbWord();
                                  });
                                });
                              }
                            );
                          });
                      })
                      .catch((err) => {
                        console.log("BULK update error");
                        console.log(JSON.stringify(err, null, 2));
                      });
                  } else {
                    Belief.create(beliefStructure, (err, b) => {
                      if (err) throw err;
                      cbWord();
                    });
                  }
                });
            });

            report.push({
              word: word,
              exist: false,
              saved: true,
              isNgram: isNgram,
            });
          } else {
            report.push({
              word: word,
              exist: true,
              saved: false,
              isNgram: isNgram,
            });
            cbWord();
          }
        });
      },
      (err) => {
        app_users[idClient].emit("saveNewWord", { report: report });
      }
    );
  }

  onUploadCorpus(data) {
    this.nb.processData(data);
  }

  testDataset(req) {
    let { percent, filename } = req.params;
    this.nb.test(percent, filename);
  }
  getDatasets(req) {
    let { idClient } = req.params;
    this.nb.getDatasets(idClient);
  }

  setDefaultDataset(req) {
    let { idClient } = req.params;
    let { id } = req.body;
    this.nb.setDefaultDataset(idClient, id);
  }
}

module.exports = { Dataset };
