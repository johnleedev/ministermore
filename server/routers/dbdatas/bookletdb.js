// 모바일 전단지 — DB를 소개(bookletnotice) / 행사(bookletevent)로 분리 (테이블명은 동일)
var mysql = require('mysql');

const poolOptions = {
  host: 'localhost',
  port: '3306',
  user: 'root',
  password: 'gksksla6985!',
};

var bookletnoticedb = mysql.createPool({
  ...poolOptions,
  database: 'bookletnotice',
});

var bookleteventdb = mysql.createPool({
  ...poolOptions,
  database: 'bookletevent',
});

module.exports = {
  bookletnoticedb,
  bookleteventdb,
};
