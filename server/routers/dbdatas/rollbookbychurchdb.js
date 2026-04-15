var mysql = require('mysql');
var rollbookbychurchdb = mysql.createPool({
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: 'gksksla6985!',
  database: 'rollbookbychurch'
});

module.exports = {
  rollbookbychurchdb
};
