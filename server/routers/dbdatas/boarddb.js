const { createDbPool } = require('./createDbPool');

const boarddb = createDbPool('board');

module.exports = {
  boarddb,
};
