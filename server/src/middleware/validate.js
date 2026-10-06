const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Runs after an express-validator rule set. If any rule failed, responds with
 * 422 and one message per field: { field, message }.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((err) => ({
    field: err.path,
    message: err.msg,
  }));
  return next(new ApiError(422, 'Validation failed', errors));
}

/**
 * Checks that a route parameter is a valid MongoDB ObjectId.
 * An invalid id can never match a document, so we answer 404 "<Label> not found"
 * (as documented in docs/API.md) instead of letting Mongoose throw a CastError.
 */
const validateObjectId =
  (label, param = 'id') =>
  (req, res, next) => {
    if (!/^[a-f\d]{24}$/i.test(req.params[param])) {
      return next(ApiError.notFound(`${label} not found`));
    }
    return next();
  };

module.exports = { validate, validateObjectId };
