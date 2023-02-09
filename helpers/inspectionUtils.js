const utils = require('./utils');
module.exports = {
  normalizeAllLabelsFromNestings: function (listObject, language) {
    if(!Array.isArray(listObject)){
      if(listObject.label){
        listObject.label = utils.languageMapper(listObject.label, language);
      }
      for (const key in listObject) {
        if(typeof listObject[key] === 'object'){
          if(Array.isArray(listObject[key])) listObject[key] = listObject[key].map(e => this.normalizeAllLabelsFromNestings(e, language));
          else listObject[key] = this.normalizeAllLabelsFromNestings(listObject[key], language);
        }
      }
    }else{
      listObject = listObject.map(e => this.normalizeAllLabelsFromNestings(e, language))
    }
    return listObject
  },
  pickCtaFields: (fields) =>
    fields.reduce((pre, curr) => {
      if (curr.hasOwnProperty('cta')) {
        pre = pre.concat({ name: curr.name, cta: curr.cta });
      }
      return pre;
    }, []),
  fieldsRequireForCtaAction: (sourceFields, receivedData) => {
    const toReturn = [];
    for (const sF of sourceFields) {
      if (utils.compareWithOP(receivedData[sF.name], sF.cta.condition.op, sF.cta.condition.value)) {
        toReturn.push({
          name: sF.name,
          hookRef: sF.cta.hookRef,
          options: { receivedValue: receivedData[sF.name], conditionValue: sF.cta.condition.value }
        });
      }
    }
    return toReturn;
  }
};
