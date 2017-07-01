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

router.get('/populity', function(req, res){
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
      let getRecipePhotoQuery = 'select * from my_recipe '+
      'order by myrecipe_count '+
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
              title : myRecipeData[i].myrecipe_title,
              checkSaveList : false
            };
            data_list.push(data);
          }
          callback(null, data_list, userEmail, connection);
        }
      });
    },
    function(data, userEmail, connection, callback){
      let getSavelistQuery = 'select my_savelist_origin_id from my_savelist '+
      'where user_email = ? and my_savelist_from = 2';
      connection.query(getSavelistQuery, userEmail, function(err, saveData){
        if(err){
          res.status(501).send({
            msg : "501 access save list data error"
          });
          callback("getSavelistQuery err : "+ err, null);
        }
        else{
          callback(null, saveData, data, userEmail, connection);
        }
      });
    },
    function(saveData, data, userEmail, connection, callback){
      let count = 0;
      console.log(data.length);
      async.whilst(
        function(){
          return count < data.length;
        },
        function(loop){
          console.log(count);
          for(let i = 0 ; i < saveData.length; i++){
            if(data[count].id == saveData[i].my_savelist_origin_id){
              data[count].checkSaveList = true;
            }
          }
          count++;
          console.log("here");
          loop(null);
        },
        function(err){
          callback(null,data, connection);
        }
      );
    },
    function(myRecipeData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : myRecipeData
      });
      connection.release();
      callback(null, "successful find recipe photo data in populity");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});

router.get('/newest', function(req, res){
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
              title : myRecipeData[i].myrecipe_title,
              checkSaveList : false
            };
            data_list.push(data);
          }
          callback(null, data_list, userEmail, connection);
        }
      });
    },
    function(data, userEmail, connection, callback){
      let getSavelistQuery = 'select my_savelist_origin_id from my_savelist '+
      'where user_email = ? and my_savelist_from = 4';
      connection.query(getSavelistQuery, userEmail, function(err, saveData){
        if(err){
          res.status(501).send({
            msg : "501 access save list data error"
          });
          callback("getSavelistQuery err : "+ err, null);
        }
        else{
          callback(null, saveData, data, userEmail, connection);
        }
      });
    },
    function(saveData, data, userEmail, connection, callback){
      let count = 0;
      console.log(data.length);
      async.whilst(
        function(){
          return count < data.length;
        },
        function(loop){
          console.log(count);
          for(let i = 0 ; i < saveData.length; i++){
            if(data[count].id == saveData[i].my_savelist_origin_id){
              data[count].checkSaveList = true;
            }
          }
          count++;
          console.log("here");
          loop(null);
        },
        function(err){
          callback(null,data, connection);
        }
      );
    },
    function(myRecipeData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : myRecipeData
      });
      connection.release();
      callback(null, "successful find recipe photo data in newest");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});




module.exports = router;
