const { fail } = require('../utils/response');

const notFound = (req, res, next) => {
  return fail(res, 404, `Route not found - ${req.originalUrl}`);
};

module.exports = notFound;
