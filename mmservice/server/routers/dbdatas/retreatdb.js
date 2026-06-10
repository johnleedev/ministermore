const { createDbPool } = require('./createDbPool');

const retreatdb = createDbPool('bookletretreat');

module.exports = {
  retreatdb,
};
