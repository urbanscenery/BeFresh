//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
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
          connection.release();
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
          connection.release();
          callback("getDataQuery err : "+ err, null);
        }
        else{
          let data = {
            id : contentData[0].magazine_id,
            content : contentData[0].magazine_content_image_url,
            width : contentData[0].magazine_content_w,
            height : contentData[0].magazine_content_h,
            checkSaveList : false
          };
          callback(null, data, userEmail, connection);
        }
      });
    },
    function(data, userEmail, connection, callback){
      let getSavelistQuery = 'select my_savelist_origin_id from my_savelist '+
      'where user_email = ? and my_savelist_from = 4';
      connection.query(getSavelistQuery, userEmail, function(err, saveData){
        if(err){
          res.status(501).send({
            msg : "501 access save list data error"
          });
          connection.release();
          callback("getSavelistQuery err : "+ err, null);
        }
        else{
          callback(null, saveData, data, userEmail, connection);
        }
      });
    },
    function(saveData, data, userEmail, connection, callback){
      for(let i = 0 ; i < saveData.length; i++){
        if(data.id == saveData[i].my_savelist_origin_id){
          data.checkSaveList = true;
        }
      }
      callback(null,data, connection);
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
