const { createDbPool } = require('./createDbPool');

const retreatmoredb = createDbPool('retreatmore');
const retreatdb = createDbPool('retreat');

module.exports = {
  retreatmoredb,
  retreatdb,
};
