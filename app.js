const express = require('express');
const cors = require('cors');
const upload = require("express-fileupload");
const logger = require('./middlewares/logger');
const utils = require('./helpers/utils');
const { driverSchemaRule } = require('./model/driver.schema');
const isOauthLoggedIn = require('./middlewares/isOauthLoggedIn');
const session = require('./middlewares/session');
const app = express();

app.use(cors());
app.use(upload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session)

app.get('/', (req, res) => {
  const toSend = {
    version: 1.0,
    baseEndPoint: '/buddy-bff',
    driver: {
      path: '/driver',
      protected: 'x-api-key',
      methods: {
        get: ['/', '/:staffId'],
        post: ['/'],
        put: ['/:staffId'],
        patch: ['/:staffId'],
        delete: ['/:staffId'],
      },
      query: ['filter', 'projection'],
      schema: utils.schemaDoc(driverSchemaRule),
    },
  };
  return res.json(toSend);
});

app.use('/buddy-oauth', require('./oAuth'))

app.use('/assets', isOauthLoggedIn, require('./assets'))
app.use('/tool', isOauthLoggedIn, require('./tool'))

app.use(logger.routerLogger(['staffData.driverId', 'staffData.companyCode', 'inspector.insPectorId', 'inspector.companyCode'], 172800));

app.use('/buddy-bff', require('./routes'));

app.use(logger.errorLogger());

module.exports = app;
