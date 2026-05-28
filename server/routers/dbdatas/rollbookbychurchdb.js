const { createDbPool } = require('./createDbPool');

const rollbookbychurchdb = createDbPool('rollbookbychurch');

module.exports = {
  rollbookbychurchdb,
};
