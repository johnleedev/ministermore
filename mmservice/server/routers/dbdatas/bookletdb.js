// 모바일 전단지 — DB를 소개(bookletnotice) / 행사(bookletevent)로 분리 (테이블명은 동일)
const { createDbPool } = require('./createDbPool');

const bookletnoticedb = createDbPool('bookletnotice');
const bookleteventdb = createDbPool('bookletevent');

module.exports = {
  bookletnoticedb,
  bookleteventdb,
};
