const { createDbPool } = require('./createDbPool');

const rollbookdb = createDbPool('rollbook');

module.exports = {
  rollbookdb,
};
