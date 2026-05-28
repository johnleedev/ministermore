const { createDbPool } = require('./createDbPool');

const admindb = createDbPool('admin');

module.exports = {
  admindb,
};
