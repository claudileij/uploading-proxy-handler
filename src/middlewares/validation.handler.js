const boom = require('@hapi/boom');

/**
 * Generic validation middleware factory.
 * @param {Joi.Schema} schema - The Joi schema to validate against.
 * @param {string} property - The property of the request object to validate (e.g., 'body', 'query', 'params').
 * @returns {function} An Express middleware function.
 */
function validationHandler(schema, property) {
  return (req, res, next) => {
    const data = req[property];
    const { error } = schema.validate(data, { abortEarly: false });

    if (error) {
      // If validation fails, pass a Boom error to the error-handling middleware
      next(boom.badRequest(error));
    } else {
      // If validation succeeds, proceed to the next middleware
      next();
    }
  };
}

module.exports = validationHandler;
