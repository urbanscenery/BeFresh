//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

router.get('/:searching', function(req, res){
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
      let getRecipeQuery = 'select recipe_id, recipe_title, recipe_image ,recipe_subtitle, recipe_difficulty, recipe_cookingTime, recipe_tag '+
      'from recipes '+
      'where recipe_title like ? or recipe_subtitle like ? or recipe_description like ? or recipe_method like ? or recipe_tag like ? or recipe_material like ?';
      let data_list = [];
      let search = [];
      for(let k = 0 ; k < 6 ; k++){
        let temp = '%'+req.params.searching+'%';
        search.push(temp);
      }
      connection.query(getRecipeQuery, search, function(err, searched){
        if(err){
          res.status(501).send({
            msg : "501 get searching recipe data error"
          });
          connection.release();
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          for(let i = 0; i < searched.length; i++){
            let jsonData = JSON.parse(searched[i].recipe_image);
            let searchedData = {
              id : searched[i].recipe_id,
              image_url : jsonData.image[0].url,
              title : searched[i].recipe_title,
              subtitle : searched[i].recipe_subtitle,
              difficulty : searched[i].recipe_difficulty,
              cookingTime : searched[i].recipe_cookingTime,
              hashtag : searched[i].recipe_tag,
              checkSaveList : false
            };
            data_list.push(searchedData);
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
    function(searchedData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : {
          search : searchedData
        }
      });
      connection.release();
      callback(null, "successful find searhing recipe");
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
