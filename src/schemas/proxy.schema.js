const Joi = require('joi');

// Schema for the /generate endpoint body
const generateSchema = Joi.object({
  fileKey: Joi.string().required(),
  // Max size in bytes, e.g., 10MB = 10 * 1024 * 1024
  maxSize: Joi.number().integer().min(1).required(),
  s3PresignedUrl: Joi.string().uri().required(),
  webhook: Joi.string().uri().optional(),
  type: Joi.string().valid('put', 'multipart').default('multipart'),
});

module.exports = { generateSchema };
