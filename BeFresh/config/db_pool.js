const mysql = require('mysql');
const dbConfig = {
    host: 'ytkimdb.cyhhsuwkhdec.ap-northeast-2.rds.amazonaws.com',
    port: '3306', //mysql 포트
    user: 'ytkim55',
    password: 'yt895620', //mysql 비밀번호
    database: 'BeFresh', //mysql 프로젝트이름
    connectionLimit: 23 // 커넥션 갯수를 23개로 제한 보통 default 로 23개 많이씀
};
const dbpool = mysql.createPool(dbConfig);

module.exports = dbpool;
