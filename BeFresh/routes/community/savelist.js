//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');


router.get('/recipephoto', function(req, res){
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
      let getSaveRecipePhotoQuery = 'select save.my_savelist_id, origin.myrecipe_id, origin.myrecipe_title, origin.myrecipe_image_url '+
      'from my_savelist save inner join my_recipe origin '+
      'on save.my_savelist_origin_id = origin.myrecipe_id and save.my_savelist_from = 2 and save.user_email = ? '+
      'order by save.my_savelist_id desc';
      connection.query(getSaveRecipePhotoQuery, userEmail, function(err, saveRecipePhoto){
        if(err){
          res.status(501).send({
            msg : "501 get save list data error"
          });
          connection.release();
          callback("getSavelistQuery err : "+ err, null);
        }
        else{
          let data_list = [];
          for(let i = 0; i< saveRecipePhoto.length; i++){
            let data;
            data = {
              id : saveRecipePhoto[i].myrecipe_id,
              imageUrl : saveRecipePhoto[i].myrecipe_image_url,
              title : saveRecipePhoto[i].myrecipe_title,
              checkSaveList : true
            };
            data_list.push(data);
          }
          callback(null, data_list, connection);
        }
      });
    },
    function(saveData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : saveData
      });
      connection.release();
      callback(null, "successful find saved recipe photo data");
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



router.get('/restaurant', function(req, res){
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
      let getSaveRestaurantQuery = 'select save.my_savelist_id, origin.restaurant_id, origin.restaurant_title, origin.restaurant_image_url, origin.restaurant_location_image_url, origin.restaurant_content '+
      'from my_savelist save inner join restaurant origin '+
      'on save.my_savelist_origin_id = origin.restaurant_id and save.my_savelist_from = 3 and save.user_email = ? '+
      'order by save.my_savelist_id desc';
      connection.query(getSaveRestaurantQuery, userEmail, function(err, saveRestaurant){
        if(err){
          res.status(501).send({
            msg : "501 get save list data error"
          });
          connection.release();
          callback("getSavelistQuery err : "+ err, null);
        }
        else{
          let data_list = [];
          for(let i = 0; i< saveRestaurant.length; i++){
            let data;
            data = {
              id : saveRestaurant[i].restaurant_id,
              imageUrl : saveRestaurant[i].restaurant_image_url,
              title : saveRestaurant[i].restaurant_title,
              location : saveRestaurant[i].restaurant_location_image_url,
              content : saveRestaurant[i].restaurant_content,
              checkSaveList : true
            };
            data_list.push(data);
          }
          callback(null, data_list, connection);
        }
      });
    },
    function(saveData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : saveData
      });
      connection.release();
      callback(null, "successful find saved restaurant data");
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






router.get('/magazine', function(req, res){
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
      let getSaveRecipePhotoQuery = 'select save.my_savelist_id, origin.magazine_id, origin.magazine_title, origin.magazine_image_url '+
      'from my_savelist save inner join magazine origin '+
      'on save.my_savelist_origin_id = origin.magazine_id and save.my_savelist_from = 4 and save.user_email = ? '+
      'order by save.my_savelist_id desc';
      connection.query(getSaveRecipePhotoQuery, userEmail, function(err, saveMagazine){
        if(err){
          res.status(501).send({
            msg : "501 get save list data error"
          });
          connection.release();
          callback("getSavelistQuery err : "+ err, null);
        }
        else{
          let data_list = [];
          for(let i = 0; i< saveMagazine.length; i++){
            let data;
            data = {
              id : saveMagazine[i].magazine_id,
              imageUrl : saveMagazine[i].magazine_image_url,
              title : saveMagazine[i].magazine_title,
              checkSaveList : true
            };
            data_list.push(data);
          }
          callback(null, data_list, connection);
        }
      });
    },
    function(saveData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : saveData
      });
      connection.release();
      callback(null, "successful find saved magazine data");
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
