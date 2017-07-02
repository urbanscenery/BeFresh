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
      let getSaveQuery = 'select s.my_savelist_id, r.recipe_id, r.recipe_title, r.recipe_subtitle, r.recipe_image, r.recipe_cookingTime, r.recipe_tag '+
      'from my_savelist s inner join recipes r '+
      'on s.my_savelist_origin_id = r.recipe_id and s.my_savelist_from = 1 and s.user_email = ? '+
      'order by s.my_savelist_id';
      connection.query(getSaveQuery, userEmail, function(err, data){
        if(err){
          res.status(501).send({
            msg : "501 get saved recipe data error"
          });
          connection.release();
          callback("getSaveQuery err : "+ err, null);
        }
        else{
          let data_list = [];
          for(let i = 0; i < data.length; i++){
            let jsonData = JSON.parse(data[i].recipe_image);
            let lastData = {
              id : data[i].recipe_id,
              image_url : jsonData.image[0].url,
              title : data[i].recipe_title,
              subtitle : data[i].recipe_subtitle,
              difficulty : data[i].recipe_difficulty,
              cookingTime : data[i].recipe_cookingTime,
              hashtag : data[0].recipe_tag,
              checkSaveList : true
            };
            data_list.push(lastData);
          }
          callback(null, data_list, connection);
        }
      });
    },
    function(saveData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : {
          savedRecipe :saveData
        }
      });
      connection.release();
      callback(null, moment().format('MM/DDahh.mm.ss : ') + "Successful find saved recipe");
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
