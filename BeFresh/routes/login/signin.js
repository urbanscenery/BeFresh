//52.78.124.103:3412/signin
const mysql = require('mysql');
const express = require('express');
const async = require('async');
const bcrypt = require('bcrypt');
const router = express.Router();
const aws = require('aws-sdk');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const saltRounds = 10;

function chkPwd(str){
  var pwd = /^.*(?=.{8,20})(?=.*[0-9])(?=.*[a-zA-Z]).*$/;
  if (!pwd.test(str)) {
    return false;
  }
  return true;
}

function chkEmail(str){
  var email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;
  if (!email.test(str)){
    return false;
  }
  return true;
}

function chkName(str){
  var name = /^.*(?=.{1,20})(?=.*[a-zA-Z가-힣0-9]).*$/;
  if( !name.test(str)){
    return false;
  }
  return true;
}

router.post('/', function(req, res) {
  let task_array = [
    //1.connection 설정
    function(callback) {
      pool.getConnection(function(err, connection) {
        if (err) callback("getConnection error : " + err, null);
        else callback(null, connection);
      });
    },
    //2. 이메일, 비밀번호 유효성 검사.
    function(connection,callback){
      if(!chkPwd(req.body.pwd)){
        res.status(400).send({
          msg : "Useless Password"
        });
        connection.release();
        callback("useless password", null);
      }
      else if(!chkEmail(req.body.email)){
        res.status(400).send({
          msg : "Useless E-Mail"
        });
        connection.release();
        callback("useless email", null);
      }
      else if(!chkName(req.body.name)){
        res.status(400).send({
          msg : "Useless Name"
        });
        connection.release();
        callback("useless name", null);
      }
      else callback(null, connection);
    },
    //3. 입력받은 email값이 data에 있는지 검사
    function(connection, callback) {
      let checkEmailQuery = 'select * from users where users.user_email = ?';
      connection.query(checkEmailQuery, req.body.email, function(err, mail) {
        if (err) {res.status(401).send({
          msg : "query err." + err
        });
          connetion.release();
          callback("1st query err : " + err, null);
        }
        else{
          callback(null, mail, connection);
        }
      });
    },
    //4. 없으면 회원가입진행 -> 비밀번호 암호화
    function(mail, connection, callback) {
      if (mail.length === 0) {
        bcrypt.hash(req.body.pwd, saltRounds, function(err, hash) {
          if (err) {
            connection.release();
            callback("Password hashing error : " + err, null);
          } else callback(null, hash, connection);
        });
      } else {
        res.status(401).send({
          msg : "email overlap."
        });
        connection.release();
        callback("email overlap", null);
      }
    },
    //5. 암호화된 비밀번호를 이용해 회원가입 완료.
    function(hash, connection, callback) {
      let query = 'insert into users values(?,?,?,?,?,?)';
      connection.query(query, [req.body.email,hash ,req.body.name, 'N', null, 0], function(err) {
        if (err) {
          connection.release();
          callback("insert error : " + err, null);
        } else {
          res.status(201).send({
            msg : "Success"
          });
          callback(null, connection);
        }
      });
    },
    //6. connection 해제.email overlap
    function(connection, callback) {
      connection.release();
      callback(null, "Successful signin");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err){
      err = moment().format('MM/DDahh:mm:ss//') + err;
      console.log(err);
    }
    else{
      result = moment().format('MM/DDahh:mm:ss//') + result;
      console.log(result);
    }
  });
});



module.exports = router;
