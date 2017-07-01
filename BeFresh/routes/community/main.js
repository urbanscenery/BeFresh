//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const async = require('async');
const multerS3 = require('multer-s3');
const router = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');
//const config = JSON.parse(fs.readFileSync('./config/aws_config.json'));
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');
const s3 = new aws.S3();
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'befreshcommunity',
        acl: 'public-read',
        key: function(req, file, cb) {
            cb(null, Date.now() + '.' + file.originalname.split('.').pop());
        }
    })
});

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
      let getRecipePhotoQuery = 'select * from my_recipe '+
      'order by myrecipe_post_time '+
      'limit 6';
      let data_list = [];
      connection.query(getRecipePhotoQuery, function(err,myRecipeData){
        if(err){
          res.status(501).send({
            msg : "501 get recipe photo error"
          });
          callback("getRecipePhotoQuery err : "+ err, null);
        }
        else{
          for(let i = 0 ; i < myRecipeData.length ; i++){
            let data;
            data = {
              id : myRecipeData[i].myrecipe_id,
              imageUrl : myRecipeData[i].myrecipe_image_url,
              title : null,
              etcInformation : null,
              checkSaveList : false,
              from : 2
            };
            data_list.push(data);
          }
          callback(null, data_list, userEmail, connection);
        }
      });
    },
    function(myRecipeData, userEmail, connection, callback){
      let getRestaurantQuery = 'select * from restaurant '+
      'order by restaurant_post_time '+
      'limit 6';
      let data_list = [];
      connection.query(getRestaurantQuery, function(err, restaurantData){
        if(err){
          res.status(501).send({
            msg : "501 get restaurant error"
          });
          callback("getRestaurantQuery err : "+ err, null);
        }
        else{
          for(let i = 0 ; i < restaurantData.length; i++){
            let data;
            data = {
              id : restaurantData[i].restaurant_id,
              imageUrl : restaurantData[i].restaurant_image_url,
              title : restaurantData[i].restaurant_title,
              etcInformation : restaurantData[i].restaurant_location,
              checkSaveList : false,
              from : 3
            };
            data_list.push(data);
          }
          callback(null, data_list, myRecipeData, userEmail, connection);
        }
      });
    },
    function(restaurantData, myRecipeData, userEmail, connection, callback){
      let getMagazineQuery = 'select * from magazine '+
      'order by magazine_post_time '+
      'limit 6';
      let data_list = [];
      connection.query(getMagazineQuery, function(err, magazineData){
        if(err){
          res.status(501).send({
            msg : "501 get magazine error"
          });
          callback("getMagazineQuery err : "+ err, null);
        }
        else{
          for(let i = 0 ; i < magazineData.length; i++){
            let data;
            data = {
              id : magazineData[i].magazine_id,
              imageUrl : magazineData[i].magazine_image_url,
              title : magazineData[i].magazine_title,
              etcInformation : null,
              checkSaveList : false,
              from : 4
            };
            data_list.push(data);
          }
          callback(null, data_list, restaurantData, myRecipeData, userEmail, connection);
        }
      });
    },
    function(magazineData, restaurantData, myRecipeData, userEmail, connection, callback){
      var finalData = {
        RecipePhoto : myRecipeData,
        Restaurant : restaurantData,
        Magazine : magazineData,
        SaveList : null
      };
      res.status(200).send({
        msg : "Success",
        data : finalData
      });
      connection.release();
      callback(null, "successful find main data");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});



module.exports = router;
