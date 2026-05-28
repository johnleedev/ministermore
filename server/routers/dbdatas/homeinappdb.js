const { createDbPool } = require('./createDbPool');

const homeinappdb = createDbPool('homeinapp');

module.exports = {
  homeinappdb,
};
