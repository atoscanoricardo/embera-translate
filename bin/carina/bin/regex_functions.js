const { regexSW } = require("../lib/regexStopWords");
const removeSpaceOnInit = s => s.replace(/^ */, "");
const removeDoubleQuotesOnInit = s => s.replace(/^"/, "");
const removeDoubleQuotesOnEnd = s => s.replace(/"$/, "");
const lowerCaseFirstLetter = s => s.replace(/^[A-Z]/, m => m.toLowerCase());
const lowerCasePointLetter = s => s.replace(/. [A-Z]/, m => m.toLowerCase());
const isDoubleQuotesOnInit = s => /[^"]/.test(s);
const tokenExistRegex = (d, s) => new RegExp(`(\\W|^)${s}(\\W|$)`, "g").test(d);
const removeSpecialCharacters = string =>
  string.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/g, "");
const clearLabels = (string, i) =>
  string != undefined
    ? string.replace(/[`~!@#$%^&*()|+\-=?;:'",.<>\{\}\[\]\\\/ ]/g, "")
    : console.log(i);

var removeStopWord = d =>
  d
    .replace(new RegExp(regexSW, "g"), " ")
    .replace(new RegExp(regexSW, "g"), " ")
    .replace(new RegExp(regexSW, "g"), " ");

module.exports = {
  removeSpaceOnInit,
  removeDoubleQuotesOnInit,
  removeDoubleQuotesOnEnd,
  lowerCaseFirstLetter,
  lowerCasePointLetter,
  isDoubleQuotesOnInit,
  removeStopWord,
  tokenExistRegex,
  removeSpecialCharacters,
  clearLabels
};
