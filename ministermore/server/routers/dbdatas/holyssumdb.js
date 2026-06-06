const { createDbPool } = require('./createDbPool');

const holyssumdb = createDbPool('holyssum');

module.exports = {
  holyssumdb,
};
