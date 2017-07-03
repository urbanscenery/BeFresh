//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');


router.post('/time', function(req, res){
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
      let getRecipeQuery;
      if(req.body.overthirty == 0){
        getRecipeQuery = 'select recipe_id, recipe_title, recipe_image, recipe_subtitle, recipe_difficulty, recipe_cookingTime, recipe_tag, recipe_post_time from recipes '+
        "where recipe_cookingTime < 30 and recipe_category = 'V' and recipe_post_time <= week(?) "+
        'order by recipe_post_time desc';
      }
      else{
        getRecipeQuery = 'select recipe_id, recipe_title, recipe_image, recipe_subtitle, recipe_difficulty, recipe_cookingTime, recipe_tag, recipe_post_time from recipes '+
        "where recipe_cookingTime >= 30 and recipe_category = 'V' and recipe_post_time <= week(?) "+
        'order by recipe_post_time desc';
      }

      let data_list = [];
      connection.query(getRecipeQuery, moment().format('YYYY-MM-DD'), function(err, fromTime){
        if(err){
          res.status(501).send({
            msg : "501 get wellbeing recipe data error"
          });
          connection.release();
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          for(let i = 0; i < fromTime.length; i++){
            let jsonData = JSON.parse(fromTime[i].recipe_image);
            let timeData = {
              id : fromTime[i].recipe_id,
              image_url : jsonData.image[0].url,
              title : fromTime[i].recipe_title,
              subtitle : fromTime[i].recipe_subtitle,
              difficulty : fromTime[i].recipe_difficulty,
              cookingTime : fromTime[i].recipe_cookingTime,
              hashtag : fromTime[i].recipe_tag,
              postTime : fromTime[i].recipe_post_time,
              checkSaveList : false
            };
            data_list.push(timeData);
          }
          callback(null, data_list, userEmail, connection);
        }
      });
    },

    function(data, userEmail, connection, callback){
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


    function(timeData, connection, callback){
      if(timeData[0].postTime == moment().week()){
        let current = timeData[0];
        timeData.shift();
        res.status(200).send({
          msg : "Success",
          data : {
            thisWeek : current,
            pastWeek : timeData
          }
        });
      }
      else{
        res.status(200).send({
          msg : "Success",
          data : {
            thisWeek : null,
            pastWeek : timeData
          }
        });
      }
      connection.release();
      callback(null, "successful find vegetarian recipe from time");
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

router.post('/material', function(req, res){
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
      let queryString = 'select recipe_id, recipe_title, recipe_image, recipe_subtitle, recipe_difficulty, recipe_cookingTime, recipe_tag, recipe_post_time from recipes '+
      "where recipe_post_time <= week(?) and recipe_category = 'V'";
      if(req.body.gluten == 1){
        queryString = queryString +' and recipe_gluten = 1';
      }
      if(req.body.egg == 1){
        queryString = queryString + ' and recipe_egg = 1';
      }
      if(req.body.dryfruit == 1){
        queryString = queryString + ' and recipe_dryfruit = 1';
      }
      if(req.body.milk == 1){
        queryString = queryString + ' and recipe_milk = 1';
      }
      if(req.body.fish == 1){
        queryString = queryString + ' and recipe_fish = 1';
      }
      if(req.body.meat == 1){
        queryString = queryString + ' and recipe_meat = 1';
      }
      queryString += ' order by recipe_post_time desc';
      callback(null, queryString, userEmail, connection);
    },
    function(getRecipeQuery ,userEmail, connection, callback){
      let data_list = [];
      connection.query(getRecipeQuery, moment().format('YYYY-MM-DD'), function(err, fromMaterial){
        if(err){
          res.status(501).send({
            msg : "501 get vegetarian recipe data error"
          });
          connection.release();
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          for(let i = 0; i < fromMaterial.length; i++){
            let jsonData = JSON.parse(fromMaterial[i].recipe_image);
            let timeData = {
              id : fromMaterial[i].recipe_id,
              image_url : jsonData.image[0].url,
              title : fromMaterial[i].recipe_title,
              subtitle : fromMaterial[i].recipe_subtitle,
              difficulty : fromMaterial[i].recipe_difficulty,
              cookingTime : fromMaterial[i].recipe_cookingTime,
              hashtag : fromMaterial[i].recipe_tag,
              postTime : fromMaterial[i].recipe_post_time,
              checkSaveList : false
            };
            data_list.push(timeData);
          }
          callback(null, data_list, userEmail ,connection);
        }
      });
    },

    function(data, userEmail, connection, callback){
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


    function(materialData, connection, callback){
      if(materialData.length === 0){
        res.status(200).send({
          msg : "Success",
          data : {
            thisWeek : null,
            pastWeek : []
          }
        });
      }
      else{
        if(materialData[0].postTime == moment().week()){
          let current = materialData[0];
          materialData.shift();
          res.status(200).send({
            msg : "Success",
            data : {
              thisWeek : current,
              pastWeek : materialData
            }
          });
        }
        else{
          res.status(200).send({
            msg : "Success",
            data : {
              thisWeek : null,
              pastWeek : materialData
            }
          });
        }
      }

      connection.release();
      callback(null, "successful find vegetarian recipe from time");
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
