const { createDbPool } = require('./createDbPool');

const recruitdb = createDbPool('recruit');

module.exports = {
  recruitdb,
};
