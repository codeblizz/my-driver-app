const AWS = require('aws-sdk');
const { env, host } = require('../config');

// s3 config
const s3 = new AWS.S3({
  region: 'me-south-1',
  accessKeyId: env.AWS_ACCESS_KEY_ID, // your AWS access id
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY // your AWS access key
});

async function uploadFile(file) {
  const params = {
    Bucket: env.AWS_BUCKET,
    Key: `temp/${Date.now()}_${file.name}`,
    Body: file.data
  };
  const options = {
    partSize: 10 * 1024 * 1024,
          // how many concurrent uploads
    queueSize: 5
  };
  const data = await s3.upload(params, options).promise();
  return data.Location; // returns the url location
}

async function moveFile(fileName, destFolder = 'buddy') {
  if(!fileName) return '';
  fileName = fileName.split('temp/');
  const s3Params = {
    Bucket: env.AWS_BUCKET,
    CopySource: `${env.AWS_BUCKET}/temp/${fileName[1]}`,
    Key: `${destFolder}/${fileName[1]}`
  };
  try {
    await s3.copyObject(s3Params).promise();
    await s3.deleteObject({ Bucket: env.AWS_BUCKET, Key: `temp/${fileName}` }).promise();
    return host.selfHost + '/assets/' + s3Params.Key;
  } catch (error) {
    if (error.code === 'NoSuchKey'){
      delete s3Params.CopySource;
      delete s3Params.ACL;
      const isObjectExist = await s3.headObject(s3Params).promise();
      if(isObjectExist) return fileName[0] + s3Params.Key;
    };
    throw {code: 'notFound', message:'File not found'};
  }
}

function getPresignedUrl(Key){
  const s3Params = {
    Bucket: env.AWS_BUCKET,
    Key,
    Expires: env.expireIn || 5 * 60 * 60
  };
  return s3.getSignedUrlPromise('getObject', s3Params)
}


module.exports = { uploadFile, moveFile, getPresignedUrl };
