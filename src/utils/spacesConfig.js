const AWS = require('aws-sdk');

// Activer le débogage AWS
AWS.config.logger = console; // Ajoute cette ligne pour activer le logger sur la console

const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
});

module.exports = s3;