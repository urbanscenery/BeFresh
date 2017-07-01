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

router.get('/:id', function(req, res){
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
      let getRecipeQuery = 'select * from recipes where recipe_id = ?';
      connection.query(getRecipeQuery, req.params.id, function(err, recipeData){
        if(err){
          res.status(501).send({
            msg : "501 get Recipe error"
          });
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          let material_list = JSON.parse(recipeData[0].recipe_material);
          let method = JSON.parse(recipeData[0].recipe_method);
          let imageSet = JSON.parse(recipeData[0].recipe_image);
          let recipe = {
            id : recipeData[0].recipe_id,
            imageSet : imageSet,
            title : recipeData[0].recipe_title,
            subtitle : recipeData[0].recipe_subtitle,
            hashtag : recipeData[0].recipe_tag,
            cookingTime : recipeData[0].recipe_cookingTime,
            difficulty : recipeData[0].recipe_difficulty,
            description : recipeData[0].recipe_description,
            method : method,
            material_image : recipeData[0].recipe_material_image,
            material_list : material_list.material,
            checkSaveList : false
          };
          callback(null, recipe, userEmail, connection);
        }
      });
    },
    function(recipeData, userEmail, connection, callback){
      let getReviewQuery = 'select * from reviews where recipe_id = ? '+
      'order by review_post_time '+
      'limit 2';
      connection.query(getReviewQuery, req.params.id, function(err, reviewData){
        if(err){
          res.status(501).send({
            msg : "501 get Recipe error"
          });
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          let data_list = [];
          for(let i = 0; i < reviewData.length; i++){
            let review = {
              writer : reviewData[i].user_email,
              content : reviewData[i].review_content,
              score : reviewData[i].review_score
            };
            data_list.push(review);
          }
          callback(null,data_list ,recipeData, connection);
        }
      });
    },
    function(reviewData, recipeData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : {
          recipe : recipeData,
          review : reviewData
        }
      });
      connection.release();
      callback(null, "successful send data");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});



module.exports = router;
