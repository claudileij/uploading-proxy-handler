const Joi = require('joi');

// Schema for the S3 configuration object
const s3Schema = Joi.object({
  accessKeyId: Joi.string().required(),
  secretAccessKey: Joi.string().required(),
  bucket: Joi.string().required(),
  region: Joi.string().required(),
  endpoint: Joi.string().uri().required(),
});

// Schema for the /upload endpoint body
const uploadSchema = Joi.object({
  fileName: Joi.string().required(),
  fileSize: Joi.number().integer().min(1).max(100 * 1024 * 1024).required(), // 1 byte to 100 MB
  fileType: Joi.string().required(),
  s3: s3Schema.required(),
  webhook: Joi.string().uri().optional(),
});

// Schema for the /verify endpoint body
const verifySchema = Joi.object({
  fileKey: Joi.string().required(),
  s3: s3Schema.required(),
});

// Schema for the /file (delete) endpoint body
const deleteSchema = Joi.object({
  fileKey: Joi.string().required(),
  s3: s3Schema.required(),
});

module.exports = { uploadSchema, verifySchema, deleteSchema };
