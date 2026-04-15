// 클라우드 업로드용 (naver)
var mysql = require('mysql');
var boarddb = mysql.createPool({
  host     : 'localhost',
  port     : '3306',
  user     : 'root',
  password : 'gksksla6985!',
  database : 'board'
});


module.exports = {
  boarddb
};