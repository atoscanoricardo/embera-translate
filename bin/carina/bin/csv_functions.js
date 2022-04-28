var _ = require("lodash");
var {
  removeSpaceOnInit,
  removeDoubleQuotesOnInit,
  removeDoubleQuotesOnEnd,
  lowerCaseFirstLetter,
  lowerCasePointLetter,
  removeStopWord,
  tokenExistRegex,
  removeSpecialCharacters,
  clearLabels,
} = require("./regex_functions");
const indexRecordBinary = 0;
//var dataset = [];
//Convert an array to CSV
const arrayToCSV = (arr, delimiter = ",") =>
  arr.map((v) => v.map((x) => `"${x}"`).join(delimiter)).join("\n");

//check Dataset
const checkDataset = (datasetAsArray) =>
  datasetAsArray.filter((d) => d[0] != undefined && d[1] != undefined);

//Convert an array of objects to CSV
const JSONtoCSV = (arr, columns, delimiter = ",") =>
  [
    columns.join(delimiter),
    ...arr.map((obj) =>
      columns.reduce(
        (acc, key) =>
          `${acc}${!acc - length ? "" : delimiter}"${
            !obj[key] ? "" : obj[key]
          }"`,
        ""
      )
    ),
  ].join("\n");

//Convert CSV to an array of objects
const CSVToJSON = (data, delimiter = ",") => {
  const titles = data.slice(0, data.indexOf("\n")).split(delimiter);
  return data
    .slice(data.indexOf("\n") + 1)
    .split("\n")
    .map((v) => {
      const values = v.split(delimiter);
      return titles.reduce(
        (obj, title, index) => ((obj[title] = values[index]), obj),
        {}
      );
    });
};

//Convert CSV to an array-->
const CSVToArray = (data, delimiter = '","', omitFirstRow = false) =>
  data
    .slice(omitFirstRow ? data.indexOf("\n") + 1 : 0)
    .split("\n")
    .map((v) =>
      lowerCasePointLetter(
        lowerCaseFirstLetter(
          removeSpaceOnInit(
            removeDoubleQuotesOnEnd(removeDoubleQuotesOnInit(v))
          )
        )
      )
        .replace("\r", "")
        .split(delimiter)
    );

//Extract labels
const extractLabelsAndDialogs = (data, documents = [], labels = []) =>
  data.map((v, i) => [documents.push(v[0].toLowerCase()), labels.push(v[1])]);

//compact documents
const compactDocuments = (documents, labels, cDocuments = [], cLabels = []) => {
  let iLabel = -1;

  documents.map((d, i) => {
    if (documents[i] !== documents[i - 1]) {
      iLabel++;
      if (cLabels[iLabel] == undefined) cLabels[iLabel] = [];
      cDocuments.push(d);
      cLabels[iLabel].push(clearLabels(labels[i], i));
    } else {
      cLabels[iLabel].push(clearLabels(labels[i], i));
    }
  });
};

const extractTokens = (cDocuments, tokens) => {
  cDocuments.map((d) =>
    removeStopWord(d)
      .split(" ")
      .map((t) =>
        tokens.indexOf(t) === -1 && t !== "" && t !== undefined
          ? tokens.push(removeSpecialCharacters(t))
          : true
      )
  );
};

const generateCompactBinary = (cDocuments, tokens, binaryMatrizCompact) =>
  cDocuments.map((d, i) =>
    tokens.map(
      (t, j) => (binaryMatrizCompact[i][j] = tokenExistRegex(d, t) ? 1 : 0)
    )
  );

/*const generateBinary = (documents, tokens, binaryMatriz) =>
  documents.map((d, i) =>
    tokens.map((t, j) => (binaryMatriz[i][j] = tokenExistRegex(d, t) ? 1 : 0))
  );*/

const generateBinary = function (documents, tokens, dataset) {
  console.log(documents, tokens, dataset);
  for (let i = 0; i < documents.length; i++) {
    console.log(`${i} of ${documents.length}`);
    dataset.push(tokens.map((t) => (tokenExistRegex(documents[i], t) ? 1 : 0)));
  }
  /*for (let i = 0; i < documents.length; i++) {
    //32081 of 35698
    console.log(`${i} of ${documents.length}`);
    let recordDataset = [];
    for (let j = 0; j < tokens.length; j++) {
      recordDataset.push(tokenExistRegex(documents[i], tokens[j]) ? 1 : 0);
    }
    dataset.push(recordDataset);
  }*/
};

const findInRecord = function (record, i, tokens) {
  let recordDataset = [];
  for (let j = 0; j < tokens.length; j++) {
    recordDataset.push(tokenExistRegex(record, tokens[j]) ? 1 : 0);
  }

  return recordDataset;
};

const getLabelsUniq = (l) => l.filter((v, i, s) => s.indexOf(v) == i);

const fillWithFreq = (labels, labelsFrequency) =>
  labels.map((l) =>
    labelsFrequency.hasOwnProperty(l)
      ? (labelsFrequency[l] += 1)
      : (labelsFrequency[l] = 1)
  );

const getNBow = (dataset, nBow, labelsSDG) => {
  dataset.map((d, i) =>
    nBow.hasOwnProperty(labelsSDG[i])
      ? (nBow[labelsSDG[i]] += d.reduce((acc, b) => acc + b))
      : (nBow[labelsSDG[i]] = d.reduce((acc, b) => acc + b))
  );
};

//labelsFrequency {...,meta_16_1:29,...} 167 lF
//nLabels //999 nL
// pLabels {}
const getLabelsProbability = (lF, nL, pL) =>
  Object.keys(lF).map((k) => (pL[k] = lF[k] / nL));

const extractTokensBydocument = (documents, documentByTokens) => {
  documents.map((d, i) =>
    removeStopWord(d)
      .split(" ")
      .map((t) =>
        documentByTokens[i] == undefined
          ? (documentByTokens[i] = new Array(removeSpecialCharacters(t)))
          : documentByTokens[i].indexOf(t) === -1 && t !== "" && t !== undefined
          ? documentByTokens[i].push(removeSpecialCharacters(t))
          : true
      )
  );
};

var clearInterview = (interview) => {
  tokens = [];
  extractTokens(
    [lowerCaseFirstLetter(lowerCasePointLetter(removeStopWord(interview)))],
    tokens
  );
  return _.uniq(_.compact(tokens));
};

module.exports = {
  arrayToCSV,
  CSVToArray,
  CSVToJSON,
  checkDataset,
  JSONtoCSV,
  extractLabelsAndDialogs,
  compactDocuments,
  extractTokens,
  generateCompactBinary,
  generateBinary,
  getLabelsUniq,
  fillWithFreq,
  getNBow,
  getLabelsProbability,
  extractTokensBydocument,
  clearInterview,
};
