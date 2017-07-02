//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const async = require('async');
const multerS3 = require('multer-s3');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
aws.config.loadFromPath('../config/aws_config.json');
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
      let getRecipePhotoQuery = 'select myrecipe_id, myrecipe_image_url from my_recipe '+
      'order by myrecipe_post_time desc '+
      'limit 6';
      let data_list = [];
      connection.query(getRecipePhotoQuery, function(err,myRecipeData){
        if(err){
          res.status(501).send({
            msg : "501 get recipe photo error"
          });
          connection.release();
          callback("getRecipePhotoQuery err : "+ err, null);
        }
        else{
          for(let i = 0 ; i < myRecipeData.length ; i++){
            let data;
            data = {
              id : myRecipeData[i].myrecipe_id,
              imageUrl : myRecipeData[i].myrecipe_image_url,
              title : null,
              from : 2
            };
            data_list.push(data);
          }
          callback(null, data_list, userEmail, connection);
        }
      });
    },
    function(myRecipeData, userEmail, connection, callback){
      let getRestaurantQuery = 'select restaurant_id, restaurant_image_url from restaurant '+
      'order by restaurant_id desc '+
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
              title : null,
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
      'order by magazine_id desc '+
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
              from : 4
            };
            data_list.push(data);
          }
          callback(null, data_list, restaurantData, myRecipeData, userEmail, connection);
        }
      });
    },
    function(magazineData, restaurantData, myRecipeData, userEmail, connection, callback){
      let getSaveRecipePhotoQuery = 'select save.my_savelist_id, origin.myrecipe_id, origin.myrecipe_image_url '+
      'from my_savelist save inner join my_recipe origin '+
      'on save.my_savelist_origin_id = origin.myrecipe_id and save.my_savelist_from = 2 and save.user_email = ? '+
      'order by save.my_savelist_id desc '+
      'limit 6';
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
              title : null,
              from : 2,
              checkSaveList : true,
              forSort : saveRecipePhoto[i].my_savelist_id
            };
            data_list.push(data);
          }
          callback(null, data_list, magazineData, restaurantData, myRecipeData, userEmail, connection);
        }
      });
    },
    function(savelist, magazineData, restaurantData, myRecipeData, userEmail, connection, callback){
      let getSaveRestaurantQuery = 'select save.my_savelist_id, origin.restaurant_id, origin.restaurant_image_url '+
      'from my_savelist save inner join restaurant origin '+
      'on save.my_savelist_origin_id = origin.restaurant_id and save.my_savelist_from = 3 and save.user_email = ? '+
      'order by save.my_savelist_id desc '+
      'limit 6';
      connection.query(getSaveRestaurantQuery, userEmail, function(err, saveRestaurant){
        if(err){
          res.status(501).send({
            msg : "501 get save list data error"
          });
          connection.release();
          callback("getSavelistQuery err : "+ err, null);
        }
        else{
          for(let i = 0; i< saveRestaurant.length; i++){
            let data;
            data = {
              id : saveRestaurant[i].restaurant_id,
              imageUrl : saveRestaurant[i].restaurant_image_url,
              title : null,
              from : 3,
              checkSaveList : true,
              forSort : saveRestaurant[i].my_savelist_id
            };
            savelist.push(data);
          }
          callback(null, savelist, magazineData, restaurantData, myRecipeData, userEmail, connection);
        }
      });
    },
    function(savelist, magazineData, restaurantData, myRecipeData, userEmail, connection, callback){
      let getSaveRecipePhotoQuery = 'select save.my_savelist_id, origin.magazine_id, origin.magazine_title, origin.magazine_image_url '+
      'from my_savelist save inner join magazine origin '+
      'on save.my_savelist_origin_id = origin.magazine_id and save.my_savelist_from = 4 and save.user_email = ? '+
      'order by save.my_savelist_id desc '+
      'limit 6';
      connection.query(getSaveRecipePhotoQuery, userEmail, function(err, saveMagazine){
        if(err){
          res.status(501).send({
            msg : "501 get save list data error"
          });
          connection.release();
          callback("getSavelistQuery err : "+ err, null);
        }
        else{
          for(let i = 0; i< saveMagazine.length; i++){
            let data;
            data = {
              id : saveMagazine[i].magazine_id,
              imageUrl : saveMagazine[i].magazine_image_url,
              title : saveMagazine[i].magazine_title,
              from : 4,
              checkSaveList : true,
              forSort : saveMagazine[i].my_savelist_id
            };
            savelist.push(data);
          }
          callback(null, savelist, magazineData, restaurantData, myRecipeData, userEmail, connection);
        }
      });
    },
    function(savelist, magazineData, restaurantData, myRecipeData, userEmail, connection, callback){
      if(savelist.length <7){
        callback(null, savelist, magazineData, restaurantData, myRecipeData, userEmail, connection);
      }
      else{
        let by = function(name) {
          return function(o, p) {
            let a, b;
            a = o[name];
            b = p[name];
            return a < b ? 1 : -1;
          };
        };
        savelist.sort(by('forSort'));

        let finalSaved = [];
        for(let i = 0 ; i < 6; i++){
          finalSaved.push(savelist[i]);
        }
        callback(null, finalSaved, magazineData, restaurantData, myRecipeData, userEmail, connection);
      }
    },
    function(saveData,magazineData, restaurantData, myRecipeData, userEmail, connection, callback){
      var finalData = {
        RecipePhoto : myRecipeData,
        Restaurant : restaurantData,
        Magazine : magazineData,
        SaveList : saveData
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
