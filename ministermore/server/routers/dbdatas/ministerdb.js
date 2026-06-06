const { createDbPool } = require('./createDbPool');

const ministerdb = createDbPool('minister');

module.exports = {
  ministerdb,
};
