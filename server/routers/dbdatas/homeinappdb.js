var mysql = require('mysql');

const poolOptions = {
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: 'gksksla6985!',
};

var homeinappdb = mysql.createPool({
  ...poolOptions,
  database: 'homeinapp',
});

module.exports = {
  homeinappdb,
};
