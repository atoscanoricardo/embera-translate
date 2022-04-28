class BaseBelief {
  constructor() {
    this.metaKnowledge = [];
    this.matriz = [];
    this.uas = 0;
    this.pos = 0;
  }
  getBeliefStructure(data) {
    return {
      _id: data.id,
      name: data.name,
      attributes: {
        hyponym: [],
        synonym: [],
        holonym: [],
        antonym: [],
        meronym: []
      },
      numAtt: 0,
      compounddWord: [],
      isPartCompoundWord: [],
      checked: "unsanctioned",
      has: {
        gender: null,
        number: null,
        sCgr: null,
        cgr: null,
        lema: null,
        links: [],
        img: null,
        sound: null,
        video: null
      },
      isA: []
    };
  }
}

exports.BaseBelief = new BaseBelief();
