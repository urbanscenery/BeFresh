//52.78.124.103:3412/login
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db_pool');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const saltRounds = 10;

router.post('/', function(req, res){
	let task_array = [
		//1. connection설정
		function(callback){
			pool.getConnection(function(err, connection){
				if(err) callback("getConnecntion error at login: " + err, null);
				else callback(null, connection);
			});
		},
		//2. 입력된 email을 DB에서 찾음
		function(connection, callback){
			let getMailPwdQuery = 'select user_email, user_pwd from users where email = ?';
			connection.query(getMailPwdQuery, req.body.email, function(err,userdata){
				if(err){
					connection.release();
					callback("1st query err at login : "+err, null);
				}
				else callback(null, userdata, connection);
			});
		},
		//3. 입력된 email이 없을시 이메일이 없다고함, 비밀번호 틀릴시 비밀번호 틀렸다고함
		function(userdata, connection, callback){
			if(userdata.length===0){
				connection.release();
				res.status(401).send("가입된 딩email이 아닙니다.");
				callback("non signed in user", null);
				}
			else{
				bcrypt.compare(req.body.password,userdata[0].user_pwd,function(err, login){
					if(err) callback("password compare error : "+ err,null);
					else{
						if(login) callback(null, userdata[0].user_email, connection);
						else{
							connection.release();
							res.status(401).send("비밀번호가 틀립니다.");
							callback("wrong password", null);
						}
					}
				});
			}
		},
    //4. email이 있고 password 일치시 로그인 성공후 jwt 토큰발행, connection 해제.
    function(userEmail, connection, callback){
      let option = {
        algorithm : 'HS256',
			  expiresIn : 60 * 60 * 72 // 토큰의 유효기간이 72시간
      };
      let payload = {
        user_email : userEmail
      };
      let token = jwt.sign(payload, req.app.get('jwt-secret'), option);
      res.status(201).send(
        {
          token : token
        });
			connection.release();
			callback(null, "successful login");
    }
	];
	async.waterfall(task_array, function(err, result){
		if(err) console.log(err);
		else console.log(result);
	});
});

module.exports = router;
