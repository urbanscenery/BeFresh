//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
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
    function(connection, callback){
      let getReviewQuery = 'select * from reviews where recipe_id = ? '+
      'order by review_post_time ';
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
          callback(null, data_list, connection);
        }
      });
    },
    function(reviewData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : {
          review : reviewData
        }
      });
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


router.post('/registration', function(req, res){
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
          callback("JWT decoded err : "+ err, null);
        }
        else callback(null, decoded.user_email, connection);
      });
    },
    function(userEmail, connection, callback){
      let registReviewQuery = 'insert into reviews set ?';
      let data = {
        review_content : req.body.content,
        review_score : req.body.score,
        review_post_time : moment().format('MMMM Do YYYY, h:mm:ss a'),
        recipe_id : req.body.id,
        user_email : req.body.userEmail
      };
      connection.query(registReviewQuery, data, function(err){
        if(err){
          res.status(501).send({
            msg : "Regist review err"
          });
          connection.release();
          callback("Regist review err : "+ err, null);
        }
        else{
          res.status(201).send({
            msg : "Success"
          });
          connection.release();
          callback(null, "Successful writing review");
        }
      });
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
