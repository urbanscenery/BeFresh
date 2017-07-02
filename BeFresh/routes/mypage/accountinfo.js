//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

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
          connection.release();
          callback("JWT decoded err : "+ err, null);
        }
        else callback(null, decoded.user_email, connection);
      });
    },
    function(userEmail, connection, callback){
      let getUserInfoQuery = 'select * from users where user_email = ?';
      connection.query(getUserInfoQuery, userEmail, function(err, userData){
        if(err){
          res.status(501).send({
            msg : "501 get user data error"
          });
          connection.release();
          callback("getUserInfoQuery err : "+ err, null);
        }
        else{
          let check = true;
          if(userData[0].user_group == 'N') check = false;
          let userInfo = {
            email :userData[0].user_email,
            name : userData[0].user_name,
            point : userData[0].user_point,
            checkMembership : check
          };
          callback(null, userInfo, userEmail, connection);
        }
      });
    },
    function(userData, userEmail, connection, callback){
      if(userData.checkMembership){
        let getMembershipInfoQuery = 'select * from memberships where user_email = ?';
        connection.query(getMembershipInfoQuery, userEmail, function(err, membershipData){
          if(err){
            res.status(501).send({
              msg : "501 get user membership data error"
            });
            connection.release();
            callback("getMembershipInfoQuery err : "+ err, null);
          }
          else{
            let address = membershipData[0].membership_address + membershipData[0].membership_subAddress;
            let data = {
              phone : membershipData[0].membership_phone,
              address : address,
              card : "0000-****-****-**00"
            };
            callback(null, data, userData, connection);
          }
        });
      }
      else{
        let data = null;
        callback(null, data, userData, connection);
      }
    },
    function(membershipData, userData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : {
          account : userData,
          membership : membershipData
        }
      });
      connection.release();
      callback(null, "successful find user account data");
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
