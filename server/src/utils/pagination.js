const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * Reads ?page and ?limit from the query string.
 * page >= 1, 1 <= limit <= 50 (larger values are clamped to 50).
 */
function getPagination(query) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
}

/** Builds the `pagination` object returned on list endpoints. */
function buildPagination(page, limit, total) {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

/**
 * Converts ?sort=-createdAt into a Mongo sort object, but only for whitelisted
 * fields, so users cannot sort on (and probe) arbitrary fields.
 */
function parseSort(sort, allowedFields, fallback) {
  if (!sort || typeof sort !== 'string') return fallback;
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');
  return allowedFields.includes(field) ? { [field]: direction } : fallback;
}

module.exports = { getPagination, buildPagination, parseSort, MAX_LIMIT };
