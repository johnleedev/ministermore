const { createDbPool } = require('./createDbPool');

const bulletindb = createDbPool('bulletin');

module.exports = {
  bulletindb,
};
