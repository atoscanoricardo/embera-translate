const mongoose = require("mongoose");
//const uuidv4 = require("uuid/v4");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const moment = require("moment");
const path = require("path");
const async = require("async");
const _ = require("lodash");
const os = require("os");
const { BaseBelief } = require("./BaseBelief");
const Belief = require("../models/Belief");
var json2html = require("node-json2html");

class ProcessWord {
  constructor() {
    this.reportSoket = [];
    this.dataSave;
    this.filename = "";
    this.path = "";
  }

  updateSocket(io, socket) {
    //this.io = io;
    //io = socket;
  }

  async init(body, params) {
    let self = this;
    let { idClient } = params;
    let files = Object.keys(body)[0];

    this.dataSave = await files.split("\r\n");
    this.reportSoket = [];
    var transform = {
      tag: "table",
      children: [
        {
          tag: "tbody",
          children: [
            {
              tag: "tr",
              children: [
                { tag: "td", html: "${id}" },
                { tag: "td", html: "${label}" },
                { tag: "td", html: "${description}" },
                { tag: "td", html: "${caption}" },
              ],
            },
          ],
        },
      ],
    };

    await this.reportSoket.push({
      id: 0,
      label: "Recibiendo archivo",
      description: "Total palabras",
      caption: this.dataSave.length - 1,
    });
    await app_users[idClient].emit("statusProcess", this.reportSoket);

    async.autoInject(
      {
        saveData: (callback) => this.saveData(idClient, callback),
        loadCsv: (saveData, callback) => this.loadFile(saveData, callback),
        saveWords: (loadCsv, callback) => this.saveWords(loadCsv, callback),
        saveRel: (saveWords, callback) => this.saveRel(saveWords, callback),
        wordToMeta: (saveRel, callback) => this.wordToMeta(saveRel, callback),
        createBeliefNgrams: (wordToMeta, callback) =>
          this.createBeliefNgrams(wordToMeta, callback),
        relationCompose: (createBeliefNgrams, callback) =>
          this.relationCompose(createBeliefNgrams, callback),
      },
      (err, result) => {
        if (err) throw err;
        let filename = `Report_${Date.now()}_${uuidv4()}.csv`;
        let pathSave = path.join(__dirname, "..", "uploads", filename);
        let linkDownload = filename; //`<a href="${pathSave}">${filename}</a>`;
        self.reportSoket[9] = {
          id: 9,
          label: `Final del procesamiento`,
          description: `Ver log ${linkDownload}`,
          caption: ` `,
        };
        app_users[idClient].emit("statusProcess", self.reportSoket);
        fs.writeFileSync(
          pathSave,
          json2html.transform(self.reportSoket, transform)
        );
      }
    );
  }

  async saveData(idClient, callback) {
    let data = { idClient: idClient };
    this.filename = await `db_${Date.now()}_${uuidv4()}.csv`;
    this.path = await path.join(__dirname, "..", "uploads", this.filename);

    await fs.writeFileSync(this.path, this.dataSave.join(os.EOL));
    await this.reportSoket.push({
      id: 1,
      label: "Guardando archivo",
      description: "Nombre del archivo",
      caption: this.filename,
    });
    await app_users[idClient].emit("statusProcess", this.reportSoket);
    callback(null, data);
  }

  loadFile(data, callback) {
    let self = this;
    let { idClient } = data;
    fs.readFile(this.path, "utf8", async function (err, contentFile) {
      if (err) throw err;
      let tempData = await contentFile.split(/\r?\n/);
      let dataArray = [];
      await async.eachSeries(
        tempData,
        (row, callback) => {
          if (row != "") dataArray.push(row.split(","));
          callback();
        },
        (err) => {
          if (err) throw err;
          self.reportSoket.push({
            id: 2,
            label: "Abriendo archivo",
            description: "Nombre del archivo",
            caption: self.filename,
          });
          app_users[idClient].emit("statusProcess", self.reportSoket);

          _.set(data, "csv", dataArray);
          callback(null, data);
        }
      );
    });
  }

  saveWords(data, callback) {
    let { idClient, csv } = data;
    let total = csv.length;
    let duplicates = 0;
    let creates = 0;
    let percent = 0;
    let processText = "";
    let self = this;
    async.eachOfSeries(
      csv,
      (row, key, cbCsv) => {
        row[0] = row[0].toLowerCase();
        Belief.find({ name: row[0] }).exec((err, bFind) => {
          if (err) throw err;
          if (bFind.length === 0) {
            let id = new mongoose.Types.ObjectId();
            let beliefStructure = BaseBelief.getBeliefStructure({
              name: row[0],
              id: id,
            });

            Belief.create(beliefStructure, (err, b) => {
              if (err) throw err;
              creates++;
              cbCsv();
            });
          } else {
            duplicates++;
            cbCsv();
          }
          percent = Math.trunc(((key + 1) * 100) / total);
          processText = `[Duplicadas: ${duplicates}] [Creadas: ${creates}] [Belief ${row[0]}]`;
          self.reportSoket[3] = {
            id: 3,
            label: "Guardando palabras",
            description: `Procesado ${key} de ${total - 1} [${percent}%]`,
            caption: processText,
          };
          app_users[idClient].emit("statusProcess", self.reportSoket);
        });
      },
      (err) => {
        if (err) throw err;
        callback(null, data);
      }
    );
  }

  saveRel(data, callback) {
    let { idClient, csv } = data;
    let total = csv.length;
    let duplicates = 0;
    let creates = 0;
    let percent = 0;
    let processText = "";
    let self = this;
    async.eachOfSeries(
      csv,
      (row, key, cbCsv) => {
        row[2] = row[2].toLowerCase();
        Belief.find({ name: row[2] }).exec((err, bFind) => {
          if (err) throw err;
          if (bFind.length === 0) {
            let id = new mongoose.Types.ObjectId();

            let beliefStructure = BaseBelief.getBeliefStructure({
              name: row[2],
              id: id,
            });

            Belief.create(beliefStructure, (err, b) => {
              if (err) throw err;
              creates++;
              cbCsv();
            });
          } else {
            duplicates++;
            cbCsv();
          }
          percent = Math.trunc(((key + 1) * 100) / total);
          processText = `[Duplicadas: ${duplicates}] [Creadas: ${creates}] [Belief ${row[2]}]`;
          self.reportSoket[4] = {
            id: 4,
            label: "Guardando palabras relacionadas",
            description: `Procesado ${key} de ${total - 1} [${percent}%]`,
            caption: processText,
          };
          app_users[idClient].emit("statusProcess", self.reportSoket);
        });
      },
      (err) => {
        if (err) throw err;
        callback(null, data);
      }
    );
  }

  wordToMeta(data, callback) {
    let { idClient, csv } = data;
    let percent = 0;
    let processText = "";
    let self = this;
    let total = csv.length;
    async.eachOfSeries(
      csv,
      (row, key, cbCsv) => {
        Belief.find({ name: row[2] }).exec((err, beliefMeta) => {
          if (err) throw err;
          if (beliefMeta.length != 0) {
            let aRel = row[1].split("-");
            let r1 = aRel[0] == "isA" ? `${aRel[0]}` : `attributes.${aRel[0]}`;
            let r2 = aRel[1] == "isA" ? `${aRel[1]}` : `attributes.${aRel[1]}`;
            Belief.updateOne(
              { name: row[0] },
              { $addToSet: { [r1]: beliefMeta[0]._id } }
            ).exec((err, upd) => {
              if (err) throw err;

              Belief.find({ name: row[0] }).exec((err, beliefWord) => {
                Belief.updateOne(
                  { name: row[2] },
                  { $addToSet: { [r2]: beliefWord[0]._id } }
                ).exec((err, upd) => {
                  percent = Math.trunc(((key + 1) * 100) / total);
                  processText = `[${row[0]} ${row[1]} ${row[2]}]`;
                  self.reportSoket[5] = {
                    id: 5,
                    label: `Estableciendo relaciones ${aRel[0]}-${aRel[1]}`,
                    description: `Procesado ${key} de ${total} [${percent}%]`,
                    caption: processText,
                  };
                  app_users[idClient].emit("statusProcess", self.reportSoket);
                  cbCsv();
                });
              });
            });
          }
        });
      },
      (err) => {
        if (err) throw err;
        app_users[idClient].emit("statusProcess", self.reportSoket);
        callback(null, data);
      }
    );
  }

  createBeliefNgrams(data, callback) {
    let { idClient, csv } = data;
    let i = 0;
    var s = 0;
    let total = 0;
    let self = this;
    let percent = 0;
    let processText = "";

    Belief.find({ name: { $regex: /\s/ } }).exec((err, beliefs) => {
      if (err) throw err;
      total = beliefs.length;
      if (total != 0) {
        async.eachSeries(
          beliefs,
          (belief, cbBelief) => {
            s++;
            let arrBeliefs = belief.name.toLowerCase().split(" ");
            async.eachSeries(
              arrBeliefs,
              (word, cbWord) => {
                var query = { name: word },
                  update = { name: word },
                  options = {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true,
                  };

                // Find the document
                Belief.findOneAndUpdate(
                  query,
                  update,
                  options,
                  function (error, result) {
                    if (error) return;
                    i++;

                    percent = Math.trunc(((s + 1) * 100) / total);
                    processText = `Total:${total} escaneadas:${s} actualizadas: ${i}`;
                    self.reportSoket[6] = {
                      id: 6,
                      label: `Creando belief de N-grams`,
                      description: `Procesado ${s} de ${
                        total - 1
                      } [${percent}%]`,
                      caption: processText,
                    };
                    app_users[idClient].emit("statusProcess", self.reportSoket);
                    cbWord();
                  }
                );
              },
              (err) => {
                cbBelief();
              }
            );
          },
          (err) => {
            callback(null, data);
          }
        );
      } else {
        self.reportSoket[6] = {
          id: 6,
          label: `Creando belief de n-grams`,
          description: `Procesado 0 de 0 [100%]`,
          caption: `No se encontraron n-grams`,
        };
        app_users[idClient].emit("statusProcess", self.reportSoket);
        callback(null, data);
      }
    });
  }

  async relationCompose(data, cb) {
    let { idClient, csv } = data;
    //await csv.map(row => words.push(row[0]));
    let i = 0;
    let total = 0;
    let objCompound = [];
    let percent = 0;
    let processText = "";
    let self = this;
    let words = [];
    await csv.map((row) => words.push(row[0]));
    await console.log("Create relation compose");

    await Belief.find({ name: { $in: words } }).exec((err, beliefs) => {
      async.eachOfSeries(
        beliefs,
        (belief, key, callback) => {
          total = beliefs.length;
          if (belief != undefined) {
            let arrName = belief.name.toLowerCase().split(" ");
            if (arrName.length > 1) {
              Belief.find({ name: { $in: arrName } }, "_id name").exec(
                (err, ids) => {
                  let arrOrderedIndex = [];

                  arrName.forEach((wOrdered, i, arrName) => {
                    arrOrderedIndex[i] = ids.find(
                      (k) => k.name == wOrdered
                    )._id;
                  });

                  objCompound.push({ name: arrName, ids: arrOrderedIndex });
                  Belief.updateOne(
                    { _id: belief._id },
                    { $addToSet: { compounddWord: arrOrderedIndex } }
                  ).exec((err, upd) => {
                    i++;
                    if (err) throw err;

                    percent = Math.trunc(((key + 1) * 100) / total);
                    processText = `Total:${total} escaneadas:${key} actualizadas: ${i}`;
                    self.reportSoket[7] = {
                      id: 7,
                      label: `Relacionando componentes de  N-grams`,
                      description: `Procesado ${i} de ${total}`,
                      caption: processText,
                    };
                    app_users[idClient].emit("statusProcess", self.reportSoket);
                    callback();
                  });
                }
              );
            } else {
              processText = `Total:${total} escaneadas:0 actualizadas: 0`;
              self.reportSoket[7] = {
                id: 7,
                label: `Relacionando componentes de  N-grams`,
                description: `No se encontraron N-grams`,
                caption: processText,
              };
              app_users[idClient].emit("statusProcess", self.reportSoket);
              callback();
            }
          } else {
            callback();
          }
        },
        (err) => {
          Belief.find(
            { name: { $in: words }, compounddWord: { $ne: [] } },
            "compounddWord"
          ).exec((err, compounddWord) => {
            if (compounddWord.length != 0) {
              async.eachOfSeries(
                compounddWord,
                (bcw, key, callback) => {
                  compounddWord = bcw.compounddWord;
                  Belief.updateMany(
                    { _id: { $in: compounddWord } },
                    {
                      isPartOfCompoundWord: true,
                      $push: { isPartCompoundWord: compounddWord },
                    },
                    { multi: true }
                  ).exec((err) => {
                    if (err) throw err;
                    i++;
                    percent = Math.trunc(((i + 1) * 100) / total);
                    processText = `Total:${total} escaneadas:${key} actualizadas: ${i}`;
                    self.reportSoket[8] = {
                      id: 8,
                      label: `Relacionando N-grams con sus componentes`,
                      description: `Procesado ${key} de ${total}`,
                      caption: processText,
                    };
                    app_users[idClient].emit("statusProcess", self.reportSoket);
                    callback();
                  });
                },
                (err) => {
                  console.log("Finish compound word...");
                  cb(null, data);
                }
              );
            } else {
              processText = `Total:0 escaneadas:0 actualizadas: 0`;
              self.reportSoket[8] = {
                id: 8,
                label: `Relacionando N-grams con sus componentes`,
                description: `No se encontraron N-grams`,
                caption: processText,
              };
              app_users[idClient].emit("statusProcess", self.reportSoket);
              console.log("Finish compound word...");
              cb(null, data);
            }
          });
        }
      );
    });
  }
}
module.exports = { ProcessWord };
