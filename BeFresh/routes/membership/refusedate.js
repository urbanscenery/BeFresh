//52.78.124.103:3412/login
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

router.post('/', function(req, res){
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
      let getRefusedQuery = 'select * from refused '+
      'where user_email = ? and refused_date = ?';
      connection.query(getRefusedQuery, [userEmail, moment(req.body.date).week()], function(err, data){
        if(err){
          res.status(500).send({
            msg : "500 Get refused week data error"
          });
          connection.release();
          callback("getRefusedQuery err : "+err);
        }
        else callback(null, data,userEmail, connection);
      });
    },
    function(data, userEmail, connection, callback){
      let refusedDataQuery;
      if(data.length === 0){
        refusedDataQuery = 'insert into refused set ?';
        let dataSet = {
          refused_date : moment(req.body.date).week(),
          user_email : userEmail
        };
        connection.query(refusedDataQuery, dataSet, function(err){
          if(err){
            res.status(501).send({
              msg : "Regist refused date err"
            });
            connection.release();
            callback("insert refusedDataQuery err : "+ err, null);
          }
          else{
            res.status(201).send({
              msg : "Success"
            });
            connection.release();
            callback(null, "successful regist refused date");
          }
        });
      }
      else{
        refusedDataQuery = 'delete from refused '+
        'where user_email = ? and refused_date = ?';
        connection.query(refusedDataQuery, [userEmail, moment(req.body.date).week()], function(err){
          if(err){
            res.status(501).send({
              msg : "Delete refused date err"
            });
            connection.release();
            callback("insert refusedDataQuery err : "+ err, null);
          }
          else{
            res.status(201).send({
              msg : "Success"
            });
            connection.release();
            callback(null, "successful delete refused date");
          }
        });
      }
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
