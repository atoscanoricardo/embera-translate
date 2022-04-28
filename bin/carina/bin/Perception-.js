var async = require("async");
var ssm = require("../lib/Ssm");
var bcpu = require("../lib/Bcpu");
var { Belief } = require("../lib/Belief");
//var BeliefCh = require("../lib/BeliefSchema");
var { sensor } = require("../lib/Sensor");
//var CompounddWord = require("../lib/models/CompoundWordsSchema");
var { recognition } = require("./Recognition");
var { naive_bayes } = require("./Naive_Bayes");
var _ = require("lodash");

class Perception {
  constructor() {
    this.sensor = sensor;
  }

  readStimulus(req, res) {
    console.log(`readStimulus`);
    let sensor = this.sensor;
    recognition.dataAgent = req.body;
    this.sensor.wordTextPerceptor = req.body.descripcion;
    async.autoInject(
      {
        rSFE: (callback) => {
          this.readStimulusFromEnvironment(callback);
        },
        eCW: (rSFE, callback) => {
          this.extractCompoundWord(rSFE, callback);
        },
        rECW: (eCW, callback) => {
          callback(null, eCW.cw.concat(eCW.in.split(" ")));
        },
        eSMU: (rECW, callback) => {
          this.encodeSMU(callback, rECW);
        },
        sSIS: (eSMU, callback) => {
          this.saveSMUIntoSSM(callback, eSMU);
        },
        cBSSSB: (sSIS, callback) => {
          this.copyBufferSSMFromSelectedSensorIntoBCPUInput(callback, sSIS);
        },
      },
      (err, results) => {
        recognition.copiedBuffer(res);
      }
    );
  }

  readStimulusFromEnvironment(cb) {
    console.info("readStimulusFromEnvironment");
    cb(null);
  }

  extractCompoundWord(rSFE, cb) {
    console.log("Extract compoundWord");
    let proccessText = this.sensor.wordTextPerceptor.toLowerCase();
    let input = this.sensor.wordTextPerceptor.toLowerCase().split(" ");
    let temporalText = input.slice();
    let cwCandidates = [];

    async.eachOfSeries(
      input,
      (word, posWord, cbInput) => {
        BeliefCh.find({ name: word, isPartOfCompoundWord: true })
          .populate({
            path: "isPartCompoundWord",
            model: "Belief",
            select: "name -_id",
          })
          .select("name -_id")
          .exec(function (err, partsCompoundWord) {
            async.eachSeries(
              partsCompoundWord,
              (cwFind, cbCandidate) => {
                async.eachOfSeries(
                  cwFind.isPartCompoundWord,
                  function (value, key, cbC) {
                    let fWord = value[0].name;
                    if (fWord == word) {
                      let arr1 = _.map(value, "name");
                      let arr2 = temporalText.slice(
                        posWord,
                        posWord + value.length
                      );

                      let isEqual = _.isEqual(arr1, arr2);
                      if (isEqual) cwCandidates.push(arr1);
                      cbC();
                    } else {
                      cbC();
                    }
                  },
                  (err) => {
                    if (err) throw err;
                    cbCandidate();
                  }
                );
              },
              (err) => {
                if (err) throw err;
                cbInput();
              }
            );
          });
      },
      (err) => {
        if (err) throw err;
        //ordenar las compound word de mayor a menor
        async.eachOfSeries(
          cwCandidates.sort((a, b) => b.length - a.length),
          (compoundWord, key, cbCW) => {
            let cwC = _.join(compoundWord, " ");
            proccessText = proccessText.replace(cwC, "");
            cwCandidates[key] = cwC;
            cbCW();
          },
          (err) => {
            if (err) throw err;
            cb(null, { cw: cwCandidates, in: proccessText });
          }
        );
      }
    );
  }

  encodeSMU(cb, rECW) {
    let arrBelief = [];
    async.eachSeries(
      rECW,
      (word, callback) => {
        arrBelief.push(new Belief(word, null, null, null));
        callback();
      },
      (err) => {
        this.sensor.stackBufferSMU = arrBelief;
        cb(null, arrBelief);
      }
    );
  }
  saveSMUIntoSSM(cb, stackBufferSMU) {
    cb(null, stackBufferSMU);
  }
  copyBufferSSMFromSelectedSensorIntoBCPUInput(cb, buffer) {
    bcpu.input = buffer;
    cb(null, bcpu.input);
  }

  prediction(data) {
    naive_bayes.prediction(data);
  }
}

exports.perception = new Perception();
