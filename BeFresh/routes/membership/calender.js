//52.78.124.103:3412/login
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const moment = require('moment');
aws.config.loadFromPath('../config/aws_config.json');
const pool = require('../../config/db_pool');
const mysql = require('mysql');
const jwt = require('jsonwebtoken');

router.post('/', function(req, res){
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
    //3. 멤버쉽 카테고리 받아오기
    function(userEmail, connection, callback){
      let getUserDataQuery = "select user_group from users where user_email = ?";
      connection.query(getUserDataQuery, userEmail, function(err, userGroup){
        if(err){
          res.status(500).send({
            msg : "500 Get user data error"
          });
          connection.release();
          callback("get userGroup query err : "+err);
        }
        else{
		  console.log(req.body.date);
          let monday = moment(req.body.date).day(1).format('MM.DD');
          let sunday = moment(req.body.date).day(7).format('MM.DD');
          let data = {
            category : userGroup[0].user_group,
            delivery : [1,1,1],
            week : monday + " ~ " + sunday,
            recipe: []
          };
          callback(null, data, userEmail, connection);
        }
      });
    },

    function(data, userEmail, connection, callback){
      let getRefusedQuery = "select refused_date from refused "+
      "where user_email = ? and refused_date between ? and ?";
      let queryData;
      if(moment().day()<4) queryData = [userEmail, moment().week(), moment().week()+2];
      else queryData = [userEmail, moment().week()+1, moment().week()+3];
      connection.query(getRefusedQuery, queryData, function(err, refusedDate){
        if(err){
          res.status(500).send({
            msg : "500 Get refused week data error"
          });
          connection.release();
          callback("getRefusedQuery err : "+err);
        }
        else{
          if(refusedDate.length === 0 ) callback(null, data, userEmail, connection);
          else{
            let date = [];
            let thisWeek;
            if(moment().day()<4) thisWeek = moment().week();
            else thisWeek = moment().week()+1;
            for(let i = 0; i < refusedDate.length;i++){
               let index = refusedDate[i].refused_date - thisWeek;
               console.log(index);
               date.push(index);
            }
            for(let j = 0; j < date.length; j++){
              data.delivery[date[j]] = 0;
            }
            console.log(data.delivery);
            callback(null, data, userEmail, connection);
          }
        }
      });
    },
    function(data, userEmail, connection, callback){
      let getRecipeQuery = 'select recipe_id, recipe_title, recipe_image, recipe_tag from recipes '+
      'where recipe_post_time = ?';
      if(data.category != 'B'){
        getRecipeQuery += ' and recipe_category = ?';
      }
      connection.query(getRecipeQuery, [moment(req.body.date).week(), data.category], function(err, recipeData){
        if(err){
          res.status(501).send({
            msg : "501 get recipe data error"
          });
          connection.release();
          callback("getRecipeQuery err : "+ err, null);
        }
        else{
          for(let i = 0; i < recipeData.length; i++){
            let jsonData = JSON.parse(recipeData[i].recipe_image);
            let recipe = {
              id : recipeData[i].recipe_id,
              image_url : jsonData.image[0].url,
              title : recipeData[i].recipe_title,
              hashtag : recipeData[i].recipe_tag,
              delivery_date : moment(req.body.date).day(6).format('YYYY.MM.DD')
            };
            data.recipe.push(recipe);
          }
          callback(null, data, connection);
        }
      });
    },
    function(data, connection, callback){
      res.status(201).send({
        msg : "Success",
        data : data
      });
      connection.release();
      callback(null, "Successful find schedule data");
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
