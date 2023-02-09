const _ = require('lodash');
const dayjs = require('dayjs');
const logger = require('../middlewares/logger');

module.exports = {
  toLocaleTimestampString: (date) => {
    let d = date ? new Date(date) : new Date();
    d = d.toLocaleString('en-gb');
    d = d.split(', ');
    d[0] = d[0].split('/').reverse().join('-');
    return d.join('T') + '.000Z';
  },
  toOffsetToTimezone: (tz = -240) => {
    let offset = tz / -60;
    let timeZone = '';
    if (offset > 0) timeZone += '+';
    else {
      timeZone += '-';
      offset *= -1;
    }
    const hour = Math.floor(offset);
    if (hour < 10) timeZone += '0';
    timeZone += hour + ':';
    if (offset > hour) timeZone += '30';
    else timeZone += '00';
    return timeZone;
  },
  formatError: (err) => {
    process.env.IS_LOCAL && console.log(err);
    if (err.stack) {
      logger.customEvent('stackError', err, 'error');
    }
    if (err.useErr) {
      return { status: 'E', ...err };
    }
    if (!!err.errors) {
      err = Object.values(err.errors)[0];
      if (err.kind == 'user defined') {
        err.message = err.reason;
      }
    }
    const message = err.response?.data?.message
      ? err.response.data.message
      : err.message
      ? err.message
      : err;
    return { status: 'E', message };
  },
  isValidMobileNumber:(number) => /^((\+?971)|0)?5[024568]\d{7}$/.test(number.toString()),
  filterUndeletedMongooseHooks: (schema, hooks = [], additionalHooks = {}) =>
    ['find', 'findOne', ...hooks].forEach((e) =>
      schema.pre(e, function () {
        this._conditions.isDeleted = false;
        _.merge(this, additionalHooks);
      })
    ),
  schemaDoc: function (schema) {
    schema = _.cloneDeep(schema);
    if (Array.isArray(schema)) return schema.map(this.schemaDoc);
    for (const key in schema) {
      if (['isDeleted'].includes(key)) continue;
      let val = schema[key];
      if (typeof val == 'function') val = { type: typeof val() };
      else if (Array.isArray(val)) val = val.map(this.schemaDoc);
      else {
        val.type = typeof val.type();
        if (typeof val.required == 'function') val.required = true;
      }
      schema[key] = val;
    }
    return schema;
  },
  languageMapper: (langData, lang = 'EN') => langData[lang] || langData['EN'],
  formatQuery: (payload) => {
    let toReturn = '?';
    for (const key in payload) {
      toReturn += `${key}=${payload[key]}&`;
    }
    return toReturn.slice(0, -1);
  },

  getAPIConfig: (key) => ({
    headers: {
      'x-api-key': key,
      source: 'Buddysapp',
      channel: 'BFF',
      'bussiness-unit': 'AUTO',
      'accept-language': 'EN'
    }
  }),
  mergeHeaderConfig: function (key, headerObj) {
    const config = this.getAPIConfig(key);
    if (headerObj.language) {
      headerObj[accept - language] = headerObj.language;
      delete headerObj.language;
    }
    Object.assign(config.headers, headerObj);
    return config;
  },
  isEmpty: (value) => {
    return (
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim().length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0) ||
      (typeof value === 'object' &&
        Object.values(value).every((x) => x === null || x === '' || x === undefined))
    );
  },
  defaultAppDateFormat: function (date) {
    return dayjs(date).format('DD/MM/YYYY');
  },
  defaultAppTimeFormat: (time) => {
    return dayjs(time).format('h:mm:ss A');
  },
  checkMimeType: (type) => {
    const mimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (mimeTypes.includes(type)) {
      return true;
    } else {
      return false;
    }
  },
  getDropdownList: function (list, lang = 'EN') {
    return list.map((e) =>
      _.omitBy({ value: e.value, label: this.languageMapper(e.label, lang), key: e.key }, _.isNil)
    );
  },
  // for list pass type = L
  handleResponse: (response, type) => {
    if ((response.messages?.[0]?.status || response.messages?.[0]?.success) && !response.success) {
      response.success = response.messages[0].status || response.messages[0].success;
      response.message = response.messages[0].message;
    }
    const isError = !response.success || response.success == 'false';
    if (isError && !response.value) throw response.message || 'Try Again';
    if (type == 'L') return response.messages || [];
    const toReturn = {};
    response.message && (toReturn.message = response.message);
    response.messages && response.messages.length && Object.assign(toReturn, response.messages[0]);
    return toReturn;
  },
  removeEmptyDateFromObject: (data) => {
    for (const key in data) {
      if (data[key] === '1900-01-01T00:00:00Z') {
        delete data[key];
      }
    }
    return data;
  },
  compareWithOP: (from, op, to) => {
    let isTrue = false;
    switch (op) {
      case '=':
        isTrue = from == to;
        break;
      case '>':
        isTrue = from > to;
        break;
      case '<':
        isTrue = from < to;
        break;
      case '<=':
        isTrue = from <= to;
        break;
      case '>=':
        isTrue = from >= to;
        break;
    }
    return isTrue;
  },

  firstDateAndLastDate: (year, month) => {
    const lastDate = new Date(year, month).toISOString().slice(0, 10);
    return {
      fromDate: lastDate.slice(0, -2) + '01T00:00:00.000Z',
      lastDate: lastDate + 'T23:59:59.999Z'
    };
  }
};
