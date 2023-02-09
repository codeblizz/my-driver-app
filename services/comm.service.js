const client = require('../helpers/redisClient');
const config = require('../config');
const constant = require('../helpers/constant');
const axios = require('axios');
const { formatError } = require('../helpers/utils');

module.exports = {
  getCommAuthToken: async () => {
    const tokenKey = config.env.TOPIC_PREFIX + constant.COMMS_AUTH_TOKEN;
    const commAuthToken = await client.get(tokenKey);
    if (commAuthToken) return commAuthToken;
    const { data } = await axios.post(config.host.commAuthHost + '/api/v1/token', {
      username: config.env.COMM_AUTH_USER,
      password: config.env.COMM_AUTH_PASSWORD
    });
    if (!data.success) return data.errors || data.message;
    client.set(tokenKey, data.data.token, 'ex', data.data.expires_in / 1000 - 1);
    return data.data.token;
  },

  sendNotificationBulk: async function (batchData, senderId) {
    const commAuthToken = await this.getCommAuthToken();
    const option = {
      headers: { Authorization: commAuthToken }
    };
    if(senderId){
      option.headers.senderId = senderId;
    }
    return axios
      .post(config.host.commHost + '/api/v1/notification', batchData, option)
      .then((res) => console.log(res.data))
      .catch((e) => console.error(formatError(e)));
  }
};
