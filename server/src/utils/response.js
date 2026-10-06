/**
 * Sends the standard success envelope:
 *   { success: true, data, message?, pagination? }
 */
function sendSuccess(res, data, { status = 200, message, pagination } = {}) {
  const body = { success: true, data };
  if (message) body.message = message;
  if (pagination) body.pagination = pagination;
  return res.status(status).json(body);
}

/**
 * Copies only the whitelisted keys that are present in `source`.
 * null is treated like "" ("clear this field"); the models turn "" into null
 * where needed (dateOfBirth, gender).
 */
function pick(source, keys) {
  return keys.reduce((result, key) => {
    if (source[key] !== undefined) result[key] = source[key] === null ? '' : source[key];
    return result;
  }, {});
}

module.exports = { sendSuccess, pick };
