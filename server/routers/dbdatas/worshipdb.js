const { createDbPool } = require('./createDbPool');

const worshipdb = createDbPool('worship');

module.exports = {
  worshipdb,
};
