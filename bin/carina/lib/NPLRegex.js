var Belief = require("../models/Belief");
var _ = require("lodash");

class NPLRegex {
  constructor() {
    this.isUpperCase = (string) => /^[A-Z]*$/.test(string);
    this.isSpaceInit = (string) => /^"\s/.test(string);
    this.isNotSpaceInit = (string) => /^"/.test(string);
    this.isNotDoubleQuotesOnInit = (string) => /[^"]/.test(string);
    this.removeSpaceOnInit = (string) => string.replace(/^" /, '"');
    this.removeDoubleQuotesOnInit = (string) => string.replace(/^"/, "");
    this.removeDoubleQuotesOnEnd = (string) => string.replace(/"$/, "");
    this.removeSpecialCharacters = (string) =>
      string.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, "");

    this.clearMeta = (string) =>
      string.replace(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/ ]/g, "");
    this.clearArrayOfIndex = (string) =>
      string.replace(/[`~!@#$%^&*()_|+=?;:'".<>\{\}\[\]\\\/]/g, "");
    this.clearSpaceOnInitWord = (string) => string.replace(/^ /, "");
    this.clearSpaceOnEndWord = (string) => string.replace(/ $/, "");
  }

  getLemmaFromWord(word, lemas, callback) {
    Belief.find({ name: word })
      .populate({ path: "has.lema", select: "name id" })
      .exec((err, b) => {
        if (err) throw err;
        if (b.length == 0) {
          lemas.push(word);
        } else {
          let lemma = _.get(b[0], "has.lema.name");
          if (lemma == undefined) lemma = word;
          lemas.push(lemma);
        }
        callback();
      });
  }
}

exports.npl = new NPLRegex();
