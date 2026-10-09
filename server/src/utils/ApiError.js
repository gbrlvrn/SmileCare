/**
 * An error with an HTTP status code. Throw it anywhere in a controller and the
 * central error handler turns it into the standard error envelope:
 *   { success: false, message, errors? }
 */
class ApiError extends Error {
  constructor(statusCode, message, errors, retryAfter) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    if (errors) this.errors = errors;
    if (retryAfter !== undefined) this.retryAfter = retryAfter;
  }

  static badRequest(message) {
    return new ApiError(400, message);
  }

  static unauthorized(message = 'Not authorized') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message) {
    return new ApiError(409, message);
  }

  static locked(message = 'Account is temporarily locked', retryAfter = 60) {
    return new ApiError(423, message, null, retryAfter);
  }

  /** 422 with a single field error, for checks that need data from the database. */
  static validation(field, message) {
    return new ApiError(422, 'Validation failed', [{ field, message }]);
  }
}

module.exports = ApiError;
