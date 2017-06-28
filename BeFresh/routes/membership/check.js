//52.78.124.103:3412/login
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

//메인화면가기 위해서 유저멤버쉽 가입여부 정보 반환
router.get('/', function(req, res){
  let task_array = [
    //1. connection 설정
    function(callback){
			pool.getConnection(function(err, connection){
				if(err){
          res.status(500).send({
            msg : "500 Connection error"
          });
          callback("getConnecntion error at login: " + err, null);
        }
				else callback(null, connection);
			});
		},
    //2. header의 token 값으로 user_email 받아옴.
    function(connection, callback){
      let token = req.headers.token;
      jwt.verify(token, req.app.get('jwt-secret'), function(err, decoded){
        if(err){
          res.status(501).send({
            msg : "501 user authorization error"
          });
          callback("JWT decoded err : "+ err, null);
        }
        else callback(null, decoded.user_email, connection);
      });
    },
    function(userEmail, connection, callback){
      let getUserDataQuery = "select user_group from users where user_email = ?";
      connection.query(getUserDataQuery, userEmail, function(err, userGroup){
        if(err){
          res.status(500).send({
            msg : "500 Get user data error"
          });
          connection.release();
          callback("get userGroup query err : "+err);
        }
        else{
          res.status(200).send({
            msg : "Success",
            data : {
              category : userGroup[0].user_group
            }
          });
          connection.release();
          callback(null, "succesful find user group");
        }
      });
    }
  ];
  async.waterfall(task_array, function(err, result){
		if(err){
			console.log(err);
		}
		else console.log(result);
	});
});

module.exports = router;
