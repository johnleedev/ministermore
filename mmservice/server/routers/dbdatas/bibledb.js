const { createDbPool } = require('./createDbPool');

const bibledb = createDbPool('bible');

module.exports = {
  bibledb,
};
