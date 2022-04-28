var fs = require("fs");
var path = require("path");
var _ = require("lodash");
var async = require("async");
var es = require("event-stream");
var sd = require("standard-deviation");
//var stdev = require("standarddeviation");
var { npl } = require("../lib/NPLRegex");
var { matriz } = require("../lib/Matriz");
var { STOP_WORDS } = require("../lib/stopWords");
var Token = require("../models/Token");

class ProcessData {
  constructor() {}
  /*
  getCompoundWords(callback) {
    let data = { dir: this.dir };

    fs.readFile(path.join(__dirname, "files", "source", "ngrams.csv"), function(
      err,
      res
    ) {
      if (err) throw err;
      data.ngrams = res.toString().split("\r\n");
      callback(null, data);
    });
  }

  prepareDocument(data, callback) {
    let { dir } = data;
    let lineNr = 0;
    let previusLine = [];
    let arrLineTemp = [];
    let acumMetas = [];
    let lineToSave = [];
    let lastDocument = [];
    let filename = path.join(dir, `0_prepareDocument_.csv`);
    matriz.resetFile(filename);

    let s = fs
      .createReadStream(path.join(__dirname, "files", "source", this.filename))
      .pipe(es.split())
      .pipe(
        es
          .mapSync(async function(line) {
            s.pause();
            console.clear();
            console.log(`Prepare document [${lineNr}]`);
            if (npl.isSpaceInit(line)) {
              arrLineTemp = line.split('",');
              arrLineTemp[0] = `${arrLineTemp[0]}"`;
            } else if (npl.isNotSpaceInit(line)) {
              arrLineTemp = line.split('",');
              arrLineTemp[0] = `${arrLineTemp[0]}"`;
            } else if (npl.isNotDoubleQuotesOnInit(line)) {
              arrLineTemp = line.split(",");
              arrLineTemp[0] = `"${arrLineTemp[0]}"`;
            }

            if (lineNr == 0) {
              previusLine[0] = arrLineTemp[0];
              previusLine[1] = arrLineTemp[1];
              acumMetas = arrLineTemp[1];
              s.resume();
            } else {
              if (previusLine[0] != arrLineTemp[0]) {
                //
                if (acumMetas.length > 0) {
                  previusLine[1] = `"${acumMetas}"`;
                  lineToSave = previusLine;

                  acumMetas = arrLineTemp[1];
                  previusLine = arrLineTemp;
                  lastDocument = arrLineTemp;

                  if (lineToSave.length != 0) {
                    lineNr++;
                    await fs.appendFile(filename, `${lineToSave}\n`, err => {
                      if (err) throw err;
                      s.resume();
                    });
                  }
                }
              } else {
                acumMetas = await _.concat(
                  acumMetas,
                  npl.clearMeta(arrLineTemp[1])
                );
                s.resume();
              }
            }

            lineNr += 1;
          })
          .on("error", function(err) {
            if (err) throw err;
          })
          .on("end", function() {
            lastDocument[1] = acumMetas;
            fs.appendFile(filename, `${lastDocument}\n`, err => {
              if (err) throw err;
              callback(null, data);
            });
          })
      );
  }

  toLowerWords(data, callback) {
    let { dir } = data;
    let filename = path.join(dir, `1_toLower_.csv`);
    let doc = path.join(dir, `document.csv`);
    matriz.resetFile(doc);
    matriz.resetFile(filename);
    let lineNr = 0;
    let nData = 0;

    let s = fs
      .createReadStream(path.join(dir, "0_prepareDocument_.csv"))
      .pipe(es.split())
      .pipe(
        es
          .mapSync(async function(line) {
            s.pause();
            console.clear();
            console.log(`Lower words [${lineNr}]`);
            if (line != "") {
              try {
                if (npl.isSpaceInit(line)) {
                  line = await npl.removeSpaceOnInit(line);
                }

                let tLine;
                if (line.search('",') == -1) {
                  tLine = await npl.removeDoubleQuotesOnInit(line).split(",");
                } else {
                  tLine = await npl.removeDoubleQuotesOnInit(line).split('",');
                }

                tLine[0] = await _.lowerFirst(tLine[0]);

                // llenar tf

                await fs.appendFile(
                  filename,
                  `"${tLine[0]}","${tLine[1]}" \n`,
                  err => {
                    if (err) throw err;
                  }
                );

                tLine[1] = await tLine[1]
                  .split(",")
                  .map(m => `${npl.clearMeta(m)}`);

                await fs.appendFile(
                  doc,
                  `"${tLine[0]}","${tLine[1]}"\n`,
                  err => {
                    if (err) throw err;
                    s.resume();
                    nData++;
                  }
                );
              } catch (err) {
                if (err) throw err;
              }
            } else {
              nData++;
              s.resume();
            }
            lineNr += 1;
          })
          .on("error", function(err) {
            if (err) throw err;
          })
          .on("end", function() {
            data.nData = nData - 1;
            callback(null, data);
          })
      );
  }

  removeCompoundWords(data, callback) {
    let { dir, ngrams } = data;
    let filename = path.join(dir, `2_removeNgrams_.csv`);
    let lineNr = 0;
    matriz.resetFile(filename);
    let s = fs
      .createReadStream(path.join(dir, "1_toLower_.csv"))
      .pipe(es.split())
      .pipe(
        es
          .mapSync(async function(line) {
            s.pause();
            console.clear();
            console.log(`Lower words [${lineNr}]`);
            if (line != "") {
              try {
                let tLine = line.split('",');

                let arrNgrams = [];
                tLine[0] = npl.removeSpecialCharacters(tLine[0]);

                async.eachOfSeries(
                  _.uniq(ngrams),
                  (cw, key, cbNgrams) => {
                    let cwRegex = new RegExp(
                      `(\\W|^|(?=\\s))${cw}((?=\\s)\\W|$)`,
                      "g"
                    );
                    if (cwRegex.test(tLine[0])) {
                      tLine[0] = tLine[0].replace(cwRegex, " ");

                      arrNgrams.push(cw);
                    }

                    cbNgrams();
                  },
                  err => {
                    if (arrNgrams.length == 0) {
                      arrNgrams.push("null");
                    }
                    fs.appendFile(
                      filename,
                      `"${tLine[0]}","${arrNgrams}"\n`,
                      err => {
                        if (err) throw err;
                        s.resume();
                      }
                    );
                  }
                );
              } catch (err) {
                if (err) throw err;
              }
            } else {
              s.resume();
            }
            lineNr++;
          })
          .on("error", function(err) {
            if (err) throw err;
          })
          .on("end", function() {
            callback(null, data);
          })
      );
  }

  removeStopWords(data, callback) {
    let { dir } = data;
    let filename = path.join(dir, `3_removeStopWords_.csv`);
    matriz.resetFile(filename);
    let lineNr = 0;
    let s = fs
      .createReadStream(path.join(dir, "2_removeNgrams_.csv"))
      .pipe(es.split())
      .pipe(
        es
          .mapSync(async function(line) {
            s.pause();
            console.clear();
            console.log(`Remove stop words [${lineNr}]`);
            try {
              let tLine = line.split('",');
              tLine[0] = npl.removeSpecialCharacters(tLine[0]);
              async.eachOfSeries(
                _.uniq(STOP_WORDS),
                (sw, key, cbNgrams) => {
                  let expr = `(\\W|^|(?=\\s))${sw}((?=\\s)\\W|$)`;
                  let swRegex = new RegExp(expr, "g");
                  tLine[0] = tLine[0].replace(swRegex, " ");
                  cbNgrams();
                },
                err => {
                  fs.appendFile(
                    filename,
                    `"${tLine[0]}",${tLine[1]}\n`,
                    err => {
                      if (err) throw err;
                      s.resume();
                    }
                  );
                }
              );
              lineNr += 1;
            } catch (err) {
              if (err) throw err;
            }
          })
          .on("error", function(err) {
            if (err) throw err;
          })
          .on("end", function() {
            callback(null, data);
          })
      );
  }

  tokenized(data, callback) {
    let { dir } = data;
    let filename = path.join(dir, `4_tokenized_.csv`);
    let lineNr = 0;
    matriz.resetFile(filename);

    let s = fs
      .createReadStream(path.join(dir, "3_removeStopWords_.csv"))
      .pipe(es.split())
      .pipe(
        es
          .mapSync(async function(line) {
            s.pause();
            console.clear();
            console.log(`Tokenized [${lineNr}]`);
            try {
              let tLine = line.split('",');

              tLine[0] = npl.removeDoubleQuotesOnInit(tLine[0]);
              if (tLine[1] != undefined)
                tLine[1] = npl.removeDoubleQuotesOnInit(
                  npl.removeDoubleQuotesOnEnd(tLine[1])
                );

              tLine[0] = _.compact(tLine[0].split(/ /g));

              fs.appendFile(filename, `"${tLine[0]}","${tLine[1]}"\n`, err => {
                if (err) throw err;
                s.resume();
              });
            } catch (err) {
              if (err) throw err;
            }
            lineNr += 1;
          })
          .on("error", function(err) {
            if (err) throw err;
          })
          .on("end", function() {
            callback(null, data);
          })
      );
  }

  unificateTokens(data, callback) {
    let { dir } = data;
    let filename = path.join(dir, `5_allTokens_.csv`);
    let tokenForDocuments = [];
    let tokens = [];
    let n = 0;
    let lineNr = 0;
    matriz.resetFile(filename);

    let s = fs
      .createReadStream(path.join(dir, "4_tokenized_.csv"))
      .pipe(es.split())
      .pipe(
        es
          .mapSync(async function(line) {
            console.clear();
            console.log(`Unificate tokens [${lineNr}]`);
            s.pause();
            try {
              let tLine = line.split('",');
              if (tLine[0] != "" && tLine[0] != undefined) {
                tLine[0] = npl.removeDoubleQuotesOnInit(tLine[0]);
                tLine[1] = npl.removeDoubleQuotesOnInit(
                  npl.removeDoubleQuotesOnEnd(tLine[1])
                );
                tokenForDocuments[n] = _.concat(
                  tLine[0].split(","),
                  tLine[1].split(",")
                );
                tokens = _.concat(
                  tokens,
                  tLine[0].split(","),
                  tLine[1].split(",")
                );
              }
            } catch (err) {
              if (err) throw err;
            } finally {
              n++;
              s.resume();
            }
            lineNr++;
          })
          .on("error", function(err) {
            if (err) throw err;
          })
          .on("end", function() {
            tokens = _.uniq(_.compact(tokens));
            tokens = tokens.filter(
              t => t != "null" && t != "undefined" && t.length >= 2
            );

            data.tokens = tokens;
            data.tFD = tokenForDocuments;

            fs.appendFile(filename, `"${tokens}"\n`, err => {
              if (err) throw err;
              callback(null, data);
            });
          })
      );
  }

  generateDatasetN(data, callback) {
    let { dir, tokens, nData } = data;
    let n = 0;
    let lineNr = 0;
    let filename = path.join(dir, `6_datasetN_.csv`);
    matriz.resetFile(filename);

    fs.appendFile(filename, `${tokens},\n`, err => {
      if (err) throw err;
      let s = fs
        .createReadStream(path.join(dir, "document.csv"))
        .pipe(es.split())
        .pipe(
          es
            .mapSync(async function(line) {
              s.pause();
              if (line != "") {
                let p = await ((n * 100) / nData).toFixed(2);
                console.clear();
                console.log(`Generate dataset N [${p}%]: ${n} of ${nData}`);
                let rowDoc = await _.fill(Array(tokens.length), 0);
                async.eachOfSeries(
                  tokens,
                  (token, kToken, cbToken) => {
                    let exp = `(\\W|^)${token}(\\W|$)`;
                    let tokenExistRegex = new RegExp(exp, "g");
                    let index = tokens.indexOf(token);
                    if (tokenExistRegex.test(line)) {
                      rowDoc[index] = 1;
                    }
                    cbToken();
                  },
                  err => {
                    fs.appendFile(filename, `${rowDoc},\n`, err => {
                      if (err) throw err;
                      s.resume();
                    });
                  }
                );
              } else {
                s.resume();
              }
              n++;
              lineNr++;
            })
            .on("error", function(err) {
              if (err) throw err;
            })
            .on("end", function() {
              callback(null, data);
            })
        );
    });
  }

  tfDifPrepare(data, callback) {
    let { dir, nData, tokens, tFD } = data;
    let filename = path.join(dir, `7_tfDif_prepare.js`);
    matriz.resetFile(filename);
    let tf = _.fill(Array(tokens.length), 0);
    let lineNr = 0;
    console.clear();
    //console.log(tFD);

    let n = 0;
    let w;
    let D;
    let tfDifO = {
      // Objecto con los valores a procesar
      w: tokens, // token
      D: [], // Nº Document
      tf: [], // frecuencia del token en el documento
      C: nData, // totalidad de documentos
      df: [] // Repticion de la palabra en todos los documentos
    };

    let s = fs
      .createReadStream(path.join(dir, "6_datasetN_.csv"))
      .pipe(es.split())
      .pipe(
        es
          .mapSync(async function(line) {
            console.clear();
            console.log(`Tf Dif Prepare [${lineNr}]`);
            s.pause();
            let tf = 0;
            async.eachOfSeries(
              tokens,
              (token, kToken, cbToken) => {
                if (n != 0) {
                  try {
                    let row = line.split(",");
                    let index = tokens.indexOf(token);

                    if (row[index] == 1) {
                      tfDifO.D[kToken] = n;

                      // frecuencia del token en el documento
                      let tf = _.get(_.countBy(tFD[n - 1]), token);
                      _.set(tfDifO, `tf[${kToken}]`, (tf != null) + 0);

                      //  frecuencia del token en todos los documentos
                      let df = (tfDifO.df[kToken] || 0) + 1;
                      _.set(tfDifO, `df[${kToken}]`, df);
                    }
                  } catch (err) {
                    if (err) throw err;
                  } finally {
                    cbToken();
                  }
                } else {
                  cbToken();
                }
              },
              err => {
                //tfDifO.tf[n] = tf;
                s.resume();
              }
            );

            n++;
            lineNr++;
          })
          .on("error", function(err) {
            if (err) throw err;
          })
          .on("end", function() {
            fs.appendFile(filename, `${JSON.stringify(tfDifO)}`, err => {
              if (err) throw err;
              callback(null, data);
            });
          })
      );
  }

  countVectorizer(data, callback) {
    let { dir, tokens } = data;
    let tfDifO;
    let lineNr = 0;
    let tokensCalculated = [];
    let filename = path.join(dir, `8_datasetClear_.js`);
    matriz.resetFile(filename);
    let percentil = 20;

    let s = fs
      .createReadStream(path.join(dir, "7_tfDif_prepare.js"))
      .pipe(es.split())
      .pipe(
        es
          .mapSync(async function(line) {
            s.pause();
            console.clear();
            console.log(`Count vectorizer [${lineNr}]`);
            tfDifO = JSON.parse(line);
            let { w, D, tf, C, df } = tfDifO;
            async.eachOfSeries(
              w,
              (token, kToken, cbToken) => {
                let Cdf = C / df[kToken]; // Cantidad de documentos entre repeticion de la palabra en todos los documentos
                let LogCdf = Math.log(Cdf) / Math.log(10); // Logaritmo de la frecuencia
                let prod_tfLogCdf = tf[kToken] * LogCdf; // producto de la frecuencia del token en el documento por el resultado del logaritmo
                tokensCalculated.push({ token: token, value: prod_tfLogCdf });
                cbToken();
              },
              err => {
                s.resume();
              }
            );
            lineNr++;
          })
          .on("error", function(err) {
            if (err) throw err;
          })
          .on("end", async function() {
            let arrIndexSelected = [];
            let arrIndexDesSelected = [];
            let stDesv = await sd(tokensCalculated.map(o => o.value));
            let sum = await 0;
            await tokensCalculated.map(o => (sum += o.value));
            let media = await (sum / tokensCalculated.length);

            let rangSup = (await media) + stDesv;
            let rangInf = (await media) - stDesv;

            await async.eachOfSeries(
              tokensCalculated,
              async (obToken, kToken, cbToken) => {
                let value = obToken.value;
                if (value <= rangSup && value >= rangInf) {
                  await arrIndexSelected.push(_.indexOf(tokens, obToken.token));
                } else {
                  await arrIndexDesSelected.push(
                    _.indexOf(tokens, obToken.token)
                  );
                }
              },
              err => {
                if (err) throw err;
                fs.appendFile(
                  filename,
                  `${JSON.stringify(arrIndexSelected)}\n${JSON.stringify(
                    arrIndexDesSelected
                  )}`,
                  err => {
                    if (err) throw err;
                    callback(null, data);
                  }
                );
              }
            );
          })
      );
  }

  removeTokensFromDataset(data, callback) {
    let { dir } = data;
    let lineNr = 0;
    let filenameDat = path.join(dir, "9_dataset.csv");
    matriz.resetFile(filenameDat);
    let filenameDes = path.join(dir, "10_tokens_removed.csv");
    matriz.resetFile(filenameDes);

    fs.readFile(path.join(dir, "8_datasetClear_.js"), async function(err, res) {
      if (err) throw err;

      let indexOfTokens = await res.toString().split("\n");

      let selected = await npl
        .clearArrayOfIndex(indexOfTokens[0])
        .split(",")
        .map(Number);

      let deselected = await npl
        .clearArrayOfIndex(indexOfTokens[1])
        .split(",")
        .map(Number);

      let s = await fs
        .createReadStream(path.join(dir, "6_datasetN_.csv"))
        .pipe(es.split())
        .pipe(
          es
            .mapSync(async function(line) {
              console.clear();
              console.log(`Remove tokens from dataset [${lineNr}]`);
              let row = await line.split(",");
              let colSelect = [];
              let colDesSelect = [];
              s.pause();

              async.eachOfSeries(
                row,
                (cell, kCell, cbCell) => {
                  if (cell != "")
                    if (selected.indexOf(kCell) != -1 && cell != "") {
                      colSelect.push(cell);
                    }
                  if (deselected.indexOf(kCell) != -1 && cell != "") {
                    colDesSelect.push(cell);
                  }
                  cbCell();
                },
                err => {
                  fs.appendFile(filenameDat, `${colSelect}\n`, err => {
                    if (err) throw err;
                    fs.appendFile(filenameDes, `${colDesSelect}\n`, err => {
                      if (err) throw err;
                      lineNr++;
                      s.resume();
                    });
                  });
                }
              );
            })
            .on("error", function(err) {
              if (err) throw err;
            })
            .on("end", function() {
              callback(null, data);
            })
        );
    });
  }

  lemmatizeSelected(data, callback) {
    let { dir } = data;
    let n = 0;
    let document;
    let lineNr = 0;
    let s = fs
      .createReadStream(path.join(dir, "9_dataset.csv"))
      .on("data", function(data) {
        document = data.toString();
      })
      .pipe(es.split())
      .pipe(
        es
          .mapSync(function(line) {
            s.pause();
            let lemas = [];
            let words = line.split(",");

            if (n == 0) {
              async.eachOfSeries(
                words,
                (word, kWord, cbWord) => {
                  console.clear();
                  console.log(`Lemmatize selected [${lineNr}]`);
                  npl.getLemmaFromWord(word, lemas, cbWord);
                },
                err => {
                  matriz.resetFile(path.join(dir, "9_dataset.csv"));
                  fs.appendFile(
                    path.join(dir, "9_dataset.csv"),
                    `${lemas}\n${document}\n`,
                    err => {
                      lineNr++;
                      if (err) throw err;
                    }
                  );
                  s.end();
                }
              );
            }
          })
          .on("error", function(err) {
            if (err) throw err;
          })
          .on("end", function() {
            callback(null, data);
          })
      );
  }

  lemmatizeRemoved(data, callback) {
    //getLemmaFromWord
    callback(null, data);
  }*/

  getTokensSelected(i, p, fn, callback) {
    Token.find({ filename: fn, isSelect: true, isChecked: false }).exec(
      (err, tokens) => {
        if (err) throw err;
        if (tokens.length != 0) {
          callback(null, tokens);
        } else {
          callback(null, []);
        }
      }
    );
  }

  getTokensEliminados(i, p, fn, callback) {
    Token.find({ filename: fn, isSelect: false, isChecked: false }).exec(
      (err, tokens) => {
        if (err) throw err;
        if (tokens.length != 0) {
          callback(null, tokens);
        } else {
          callback(null, []);
        }
      }
    );
  }

  getTokensFinales(i, p, fn, callback) {
    Token.find({ filename: fn, isSelect: true, isChecked: true }).exec(
      (err, tokens) => {
        if (err) throw err;
        if (tokens.length != 0) {
          callback(null, tokens);
        } else {
          callback(null, []);
        }
      }
    );
  }

  totalElements(fn, socket) {
    Token.aggregate(
      [
        {
          $facet: {
            Preseleccionados: [
              { $match: { isSelect: true, isChecked: false, filename: fn } },
              { $count: "Preseleccionados" }
            ],
            Preeliminados: [
              { $match: { isSelect: false, isChecked: false, filename: fn } },
              { $count: "Preeliminados" }
            ],
            Eliminados: [
              { $match: { isSelect: false, isChecked: true, filename: fn } },
              { $count: "Eliminados" }
            ],
            Seleccionados: [
              { $match: { isSelect: true, isChecked: true, filename: fn } },
              { $count: "Seleccionados" }
            ],
            Total: [{ $match: { filename: fn } }, { $count: "Total" }]
          }
        },
        {
          $project: {
            Preseleccionados: {
              $arrayElemAt: ["$Preseleccionados.Preseleccionados", 0]
            },
            Preeliminados: {
              $arrayElemAt: ["$Preeliminados.Preeliminados", 0]
            },
            Eliminados: { $arrayElemAt: ["$Eliminados.Eliminados", 0] },
            Seleccionados: {
              $arrayElemAt: ["$Seleccionados.Seleccionados", 0]
            },
            Total: { $arrayElemAt: ["$Total.Total", 0] }
          }
        }
      ],
      function(err, result) {
        if (err) throw err;
        console.log("actualizados");
        socket.emit("totalElements", result);
      }
    );
  }
}
module.exports = { ProcessData };
