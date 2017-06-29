//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
//const config = JSON.parse(fs.readFileSync('./config/aws_config.json'));
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

router.get('/:id', function(req,res){
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
    function(userEmail, connection,callback){
      let getDataQuery = 'select * from magazine where magazine_id = ?';
      connection.query(getDataQuery, req.params.id, function(err, contentData){
        if(err){
          res.status(501).send({
            msg : "501 get magazine content error"
          });
          callback("getDataQuery err : "+ err, null);
        }
        else{
          let authUser = false;
          if(userEmail == contentData[0].user_email) authUser = true;
          let data = {
            id : contentData[0].magazine_id,
            imageUrl : contentData[0].magazine_image_url,
            title : contentData[0].magazine_title,
            content : contentData[0].magazine_text,
            checkSaveList : false
          };
          callback(null, data, connection);
        }
      });
    },
    function(contentData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : contentData
      });
      connection.release();
      callback(null, "successful find magazine content Data");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});



module.exports = router;
