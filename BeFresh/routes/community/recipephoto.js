//52.78.124.103:3412/community/recipephoto
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

router.get('/populity', function(req, res){
  let task_array = [
    //1. connection 설정
    function(callback){
			pool.getConnection(function(err, connection){
				if(err){
          res.status(500).send({
            msg : "500 Connection error"
          });
          callback( "getConnecntion error at login: " + err, null);
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
          callback(  "JWT decoded err : "+ err, null);
        }
        else callback(null, decoded.user_email, connection);
      });
    },
    function(userEmail, connection, callback){
      let getRecipePhotoQuery = 'select myrecipe_id, myrecipe_image_url from my_recipe '+
      'order by myrecipe_count '+
      'limit 6';
      let data_list = [];
      connection.query(getRecipePhotoQuery, function(err,myRecipeData){
        if(err){
          res.status(501).send({
            msg : "501 get recipe photo error"
          });
          connection.release();
          callback( "getRecipePhotoQuery err : "+ err, null);
        }
        else{
          for(let i = 0 ; i < myRecipeData.length ; i++){
            let data;
            data = {
              id : myRecipeData[i].myrecipe_id,
              imageUrl : myRecipeData[i].myrecipe_image_url,
              title : null,
              checkSaveList : false
            };
            data_list.push(data);
          }
          callback(null, data_list, userEmail, connection);
        }
      });
    },
    function(data, userEmail, connection, callback){
      let getSavelistQuery = 'select my_savelist_origin_id from my_savelist '+
      'where user_email = ? and my_savelist_from = 2';
      connection.query(getSavelistQuery, userEmail, function(err, saveData){
        if(err){
          res.status(501).send({
            msg : "501 access save list data error"
          });
          connection.release();
          callback( "getSavelistQuery err : "+ err, null);
        }
        else{
          callback(null, saveData, data, userEmail, connection);
        }
      });
    },
    function(saveData, data, userEmail, connection, callback){
      let count = 0;
      async.whilst(
        function(){
          return count < data.length;
        },
        function(loop){
          for(let i = 0 ; i < saveData.length; i++){
            if(data[count].id == saveData[i].my_savelist_origin_id){
              data[count].checkSaveList = true;
            }
          }
          count++;
          loop(null);
        },
        function(err){
          callback(null,data, connection);
        }
      );
    },
    function(myRecipeData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : myRecipeData
      });
      connection.release();
      callback(null, "successful find recipe photo data in populity");
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

router.get('/newest', function(req, res){
  let task_array = [
    //1. connection 설정
    function(callback){
			pool.getConnection(function(err, connection){
				if(err){
          res.status(500).send({
            msg : "500 Connection error"
          });
          callback( "getConnecntion error at login: " + err, null);
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
          callback( "JWT decoded err : "+ err, null);
        }
        else callback(null, decoded.user_email, connection);
      });
    },
    function(userEmail, connection, callback){
      let getRecipePhotoQuery = 'select myrecipe_id, myrecipe_image_url from my_recipe '+
      'order by myrecipe_post_time '+
      'limit 6';
      let data_list = [];
      connection.query(getRecipePhotoQuery, function(err,myRecipeData){
        if(err){
          res.status(501).send({
            msg : "501 get recipe photo error"
          });
          connection.release();
          callback( "getRecipePhotoQuery err : "+ err, null);
        }
        else{
          for(let i = 0 ; i < myRecipeData.length ; i++){
            let data;
            data = {
              id : myRecipeData[i].myrecipe_id,
              imageUrl : myRecipeData[i].myrecipe_image_url,
              title : null,
              checkSaveList : false
            };
            data_list.push(data);
          }
          callback(null, data_list, userEmail, connection);
        }
      });
    },
    function(data, userEmail, connection, callback){
      let getSavelistQuery = 'select my_savelist_origin_id from my_savelist '+
      'where user_email = ? and my_savelist_from = 2';
      connection.query(getSavelistQuery, userEmail, function(err, saveData){
        if(err){
          res.status(501).send({
            msg : "501 access save list data error"
          });
          connection.release();
          callback( "getSavelistQuery err : "+ err, null);
        }
        else{
          callback(null, saveData, data, userEmail, connection);
        }
      });
    },
    function(saveData, data, userEmail, connection, callback){
      let count = 0;
      async.whilst(
        function(){
          return count < data.length;
        },
        function(loop){
          for(let i = 0 ; i < saveData.length; i++){
            if(data[count].id == saveData[i].my_savelist_origin_id){
              data[count].checkSaveList = true;
            }
          }
          count++;
          loop(null);
        },
        function(err){
          callback(null,data, connection);
        }
      );
    },
    function(myRecipeData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : myRecipeData
      });
      connection.release();
      callback(null, "successful find recipe photo data in newest");
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
