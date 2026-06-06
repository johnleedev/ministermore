const { createDbPool } = require('./createDbPool');

const commondb = createDbPool('common');

module.exports = {
  commondb,
};
