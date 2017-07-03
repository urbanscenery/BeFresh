//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
//const config = JSON.parse(fs.readFileSync('./config/aws_config.json'));
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

router.get('/wellbeing', function(req, res){
  let task_array = [
    //1. connection 설정
    function(callback){
			pool.getConnection(function(err, connection){
				if(err){
          res.status(500).send({
            msg : "500 Connection error"
          });
          callback("getConnecntion error: " + err, null);
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
      let currentTime = moment().format('YYYY-MM-DD');
      let getRecipeQuery = 'select recipe_id, recipe_title, recipe_image, recipe_subtitle, recipe_difficulty, recipe_cookingTime, recipe_tag from recipes '+
      'where recipe_post_time = week(?) and recipe_category = ?';
      connection.query(getRecipeQuery, [currentTime, 'W'], function(err, currentWeek){
        if(err){
          res.status(501).send({
            msg : "501 get wellbeing recipe data error"
          });
          connection.release();
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          let currentData;
          if(currentWeek.length === 0){
            currentData = null;
          }
          else{
            let jsonData = JSON.parse(currentWeek[0].recipe_image);
            currentData = {
              id : currentWeek[0].recipe_id,
              image_url : jsonData.image[0].url,
              title : currentWeek[0].recipe_title,
              subtitle : currentWeek[0].recipe_subtitle,
              difficulty : currentWeek[0].recipe_difficulty,
              test : "test",
              cookingTime : currentWeek[0].recipe_cookingTime,
              hashtag : currentWeek[0].recipe_tag,
              checkSaveList : false
            };
          }
          callback(null, currentData, userEmail, connection);
        }
      });
    },

    function(data, userEmail, connection, callback){
      let getSavelistQuery = 'select my_savelist_origin_id from my_savelist '+
      'where user_email = ? and my_savelist_from = 1 and my_savelist_origin_id = ?';
      connection.query(getSavelistQuery, [userEmail, data.id] ,function(err, saveData){
        if(err){
          res.status(501).send({
            msg : "501 access save list data error"
          });
          connection.release();
          callback( "getSavelistQuery err : "+ err, null);
        }
        else{
          if(saveData.length ==1){
            data.checkSaveList = true;
          }
          callback(null, data, userEmail, connection);
        }
      });
    },

    function(currentData, userEmail, connection, callback){
      let currentTime = moment().format('YYYY-MM-DD');
      let getRecipeQuery = 'select recipe_id, recipe_title, recipe_image, recipe_subtitle, recipe_difficulty, recipe_cookingTime, recipe_tag from recipes '+
      'where recipe_post_time < week(?) and recipe_category = ?';
      let data_list = [];
      connection.query(getRecipeQuery, [currentTime, 'W'], function(err, lastWeek){
        if(err){
          res.status(501).send({
            msg : "501 get wellbeing recipe data error"
          });
          connection.release();
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          for(let i = 0; i < lastWeek.length; i++){
            let jsonData = JSON.parse(lastWeek[i].recipe_image);
            let lastData = {
              id : lastWeek[i].recipe_id,
              image_url : jsonData.image[0].url,
              title : lastWeek[i].recipe_title,
              subtitle : lastWeek[i].recipe_subtitle,
              difficulty : lastWeek[i].recipe_difficulty,
              cookingTime : lastWeek[i].recipe_cookingTime,
              hashtag : lastWeek[i].recipe_tag,
              checkSaveList : false
            };
            data_list.push(lastData);
          }
          callback(null, data_list, currentData, userEmail, connection);
        }
      });
    },

    function(data, currentData ,userEmail, connection, callback){
      let getSavelistQuery = 'select my_savelist_origin_id from my_savelist '+
      'where user_email = ? and my_savelist_from = 1';
      connection.query(getSavelistQuery, userEmail, function(err, saveData){
        if(err){
          res.status(501).send({
            msg : "501 access save list data error"
          });
          connection.release();
          callback( "getSavelistQuery err : "+ err, null);
        }
        else{
          callback(null, saveData, data, currentData ,userEmail, connection);
        }
      });
    },
    function(saveData, data, currentData ,userEmail, connection, callback){
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
          callback(null,data, currentData ,connection);
        }
      );
    },


    function(lastData, currentData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : {
          thisWeek : currentData,
          pastWeek : lastData
        }
      });
      connection.release();
      callback(null, "successful find wellbeing recipe");
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

router.get('/vegetarian', function(req, res){
  let task_array = [
    //1. connection 설정
    function(callback){
			pool.getConnection(function(err, connection){
				if(err){
          res.status(500).send({
            msg : "500 Connection error"
          });
          callback("getConnecntion error: " + err, null);
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
      let currentTime = moment().format('YYYY-MM-DD');
      let getRecipeQuery = 'select recipe_id, recipe_title, recipe_image, recipe_subtitle, recipe_difficulty, recipe_cookingTime, recipe_tag from recipes '+
      'where recipe_post_time = week(?) and recipe_category = ?';
      connection.query(getRecipeQuery, [currentTime, 'V'], function(err, currentWeek){
        if(err){
          res.status(501).send({
            msg : "501 get vegetarian recipe data error"
          });
          connection.release();
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          let currentData;
          if(currentWeek.length === 0){
            currentData = null;
          }
          else{
            let jsonData = JSON.parse(currentWeek[0].recipe_image);
            currentData = {
              id : currentWeek[0].recipe_id,
              image_url : jsonData.image[0].url,
              title : currentWeek[0].recipe_title,
              subtitle : currentWeek[0].recipe_subtitle,
              difficulty : currentWeek[0].recipe_difficulty,
              cookingTime : currentWeek[0].recipe_cookingTime,
              hashtag : currentWeek[0].recipe_tag,
              checkSaveList : false
            };
          }
          callback(null, currentData, userEmail, connection);
        }
      });
    },

    function(data, userEmail, connection, callback){
      let getSavelistQuery = 'select my_savelist_origin_id from my_savelist '+
      'where user_email = ? and my_savelist_from = 1 and my_savelist_origin_id = ?';
      connection.query(getSavelistQuery, [userEmail, data.id] ,function(err, saveData){
        if(err){
          res.status(501).send({
            msg : "501 access save list data error"
          });
          connection.release();
          callback( "getSavelistQuery err : "+ err, null);
        }
        else{
          if(saveData.length ==1){
            data.checkSaveList = true;
          }
          callback(null, data, userEmail, connection);
        }
      });
    },


    function(currentData, userEmail, connection, callback){
      let currentTime = moment().format('YYYY-MM-DD');
      let getRecipeQuery = 'select recipe_id, recipe_title, recipe_image, recipe_subtitle, recipe_difficulty, recipe_cookingTime, recipe_tag from recipes '+
      'where recipe_post_time < week(?) and recipe_category = ?';
      let data_list = [];
      connection.query(getRecipeQuery, [currentTime, 'V'], function(err, lastWeek){
        if(err){
          res.status(501).send({
            msg : "501 get vegetarian recipe data error"
          });
          connection.release();
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          for(let i = 0; i < lastWeek.length; i++){
            let jsonData = JSON.parse(lastWeek[i].recipe_image);
            let lastData = {
              id : lastWeek[i].recipe_id,
              image_url : jsonData.image[0].url,
              title : lastWeek[i].recipe_title,
              subtitle : lastWeek[i].recipe_subtitle,
              difficulty : lastWeek[i].recipe_difficulty,
              cookingTime : lastWeek[i].recipe_cookingTime,
              hashtag : lastWeek[i].recipe_tag,
              checkSaveList : false
            };
            data_list.push(lastData);
          }
          callback(null, data_list, currentData, userEmail ,connection);
        }
      });
    },

    function(data, currentData ,userEmail, connection, callback){
      let getSavelistQuery = 'select my_savelist_origin_id from my_savelist '+
      'where user_email = ? and my_savelist_from = 1';
      connection.query(getSavelistQuery, userEmail, function(err, saveData){
        if(err){
          res.status(501).send({
            msg : "501 access save list data error"
          });
          connection.release();
          callback( "getSavelistQuery err : "+ err, null);
        }
        else{
          callback(null, saveData, data, currentData ,userEmail, connection);
        }
      });
    },
    function(saveData, data, currentData ,userEmail, connection, callback){
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
          callback(null,data, currentData ,connection);
        }
      );
    },


    function(lastData, currentData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : {
          thisWeek : currentData,
          pastWeek : lastData
        }
      });
      connection.release();
      callback(null, "successful find vegetarian recipe");
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
