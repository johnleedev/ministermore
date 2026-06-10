const { createDbPool } = require('./createDbPool');

const servicedb = createDbPool('service');

module.exports = {
  servicedb,
};
