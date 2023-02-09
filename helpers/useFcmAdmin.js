const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('../buddy-firebase-service.json'))
});

module.exports = admin.app();
