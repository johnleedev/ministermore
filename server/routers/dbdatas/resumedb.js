const { createDbPool } = require('./createDbPool');

const resumedb = createDbPool('resume');

module.exports = {
  resumedb,
};
