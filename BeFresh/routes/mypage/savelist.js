//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');


router.get('/:id/:from', function(req, res){
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
      let getSavelistQuery = 'select my_savelist_id from my_savelist '+
      'where user_email = ? and my_savelist_origin_id = ? and my_savelist_from = ?';
      connection.query(getSavelistQuery, [userEmail, req.params.id, req.params.from], function(err, savlistData){
        if(err){
          res.status(501).send({
            msg : "501 get save list data error"
          });
          connection.release();
          callback("getSavelistQuery err : "+ err, null);
        }
        else{
          callback(null, savlistData, userEmail, connection);
        }
      });
    },
    function(saveList, userEmail, connection, callback){
      if(req.params.from == 2){
        let id = req.params.id;
        id = id.toString();
        let updateCountQuery = '';
        if(saveList.length === 0){
          updateCountQuery += 'update my_recipe set myrecipe_count = myrecipe_count+1 where myrecipe_id = '+id+';';
        }
        else{
          updateCountQuery += 'update my_recipe set myrecipe_count = myrecipe_count-1 where myrecipe_id = '+id +';';
        }
        connection.query(updateCountQuery, function(err){
          if(err){
            res.status(501).send({
              msg : "Update count err"
            });
            connection.release();
            callback("updateCountQuery err : "+ err, null);
          }
          else{
            callback(null, saveList, userEmail, connection);
          }
        });
      }
      else callback(null, saveList, userEmail, connection);

    },
    function(saveList, userEmail, connection, callback){
      if(saveList.length === 0){
        let registSavelistQuery = 'insert into my_savelist set ?';
        let data = {
          user_email : userEmail,
          my_savelist_post_time : moment().format('MMMM Do YYYY, h:mm:ss a'),
          my_savelist_origin_id : req.params.id,
          my_savelist_from : req.params.from
        };
        connection.query(registSavelistQuery, data, function(err){
          if(err){
            res.status(501).send({
              msg : "Save list err"
            });
            connection.release();
            callback("registSavelistQuery err : "+ err, null);
          }
          else{
            res.status(200).send({
              msg : "Success"
            });
            connection.release();
            callback(null, "successful resgist savelist");
          }
        });
      }
      else{
        let deleteSavelistQuery = 'delete from my_savelist '+
        'where my_savelist_id = ?';
        connection.query(deleteSavelistQuery, saveList[0].my_savelist_id, function(err){
          if(err){
            res.status(501).send({
              msg : "Save list err"
            });
            connection.release();
            callback("registSavelistQuery err : "+ err, null);
          }
          else{
            res.status(200).send({
              msg : "Success"
            });
            connection.release();
            callback(null, "successful delete savelist");
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
