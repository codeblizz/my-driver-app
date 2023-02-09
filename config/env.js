const env = {};

for (const key in process.env) {
    env[key] = process.env[key];
}

if(env.NODE_ENV != 'prod'){
    env['MGW_HOST'] = env.MGW_HOST + "/" + env.NODE_ENV;
}

env.isDevelopment = ['dev', 'qa'].includes(env.NODE_ENV);


module.exports = {
    env,
    appConfig: async function () {
        const { configModel } = require('../model');
        const configData = await configModel.findOne({ name:'config', __v: 0 }).lean();
        Object.assign(this.env, configData);
      }
  };
