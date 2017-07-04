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

      let getDeliveriedRecipeQuery = 'select d.delivery_date, d.delivery_check_review, r.recipe_id, r.recipe_title, r.recipe_image '+
      'from delivery d join recipes r '+
      'on d.delivery_recipe_id = r.recipe_id and d.user_email = ? '+
      'order by d.delivery_date desc';
      connection.query(getDeliveriedRecipeQuery,userEmail, function(err, data){
        if(err){
          res.status(501).send({
            msg : "501 get deliveried recipe data error"
          });
          connection.release();
          callback("getDeliveriedRecipeQuery err : "+ err, null);
        }
        else{
          let data_list = [];
          for(let i = 0; i<data.length; i++){
            let jsonData = JSON.parse(data[i].recipe_image);
            let week = data[i].delivery_date;
            let deliveriedData = {
              id : data[i].recipe_id,
              image_url : jsonData.image[0].url,
              title : data[i].recipe_title,
              deliveried_date : moment(week, 'WW').day(6).format('YYYY.MM.DD'),
              check_review : data[i].delivery_check_review
            };
            data_list.push(deliveriedData);
          }
          callback(null, data_list, connection);
        }
      });
    },
    function(deliveriedData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : {
          deliveriedRecipe : deliveriedData
        }
      });
      connection.release();
      callback(null, "Successful find deliveried recipe");
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
