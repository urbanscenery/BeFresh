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
          callback("JWT decoded err : "+ err, null);
        }
        else callback(null, decoded.user_email, connection);
      });
    },
    function(userEmail, connection, callback){
      let getRecipeQuery;
      console.log(req.body.overthirty);
      console.log(req.body.overthirty == 'f');
      if(req.body.overthirty == 'f'){
        getRecipeQuery = 'select recipe_id, recipe_title, recipe_image, recipe_subtitle, recipe_difficulty, recipe_cookingTime from recipes '+
        'where recipe_cookingTime < 30 and recipe_category = ?';
      }
      else{
        getRecipeQuery = 'select recipe_id, recipe_title, recipe_image, recipe_subtitle, recipe_difficulty, recipe_cookingTime from recipes '+
        'where recipe_cookingTime >= 30 and recipe_category = ?';
      }

      let data_list = [];
      connection.query(getRecipeQuery, 'V', function(err, fromTime){
        if(err){
          res.status(501).send({
            msg : "501 get wellbeing recipe data error"
          });
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
              checkSaveList : false
            };
            data_list.push(timeData);
          }
          callback(null, data_list, connection);
        }
      });
    },
    function(timeData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : {
          fromTime : timeData
        }
      });
      connection.release();
      callback(null, "successful find vegetarian recipe from time");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});


module.exports = router;
