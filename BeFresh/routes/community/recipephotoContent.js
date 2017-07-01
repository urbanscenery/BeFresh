//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');
const moment = require('moment');
//const config = JSON.parse(fs.readFileSync('./config/aws_config.json'));
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

router.get('/:id', function(req,res){
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
    function(userEmail, connection,callback){
      let getDataQuery = 'select * from my_recipe where myrecipe_id = ?';
      connection.query(getDataQuery, req.params.id, function(err, contentData){
        if(err){
          res.status(501).send({
            msg : "501 get recipe photo content error"
          });
          callback("getDataQuery err : "+ err, null);
        }
        else{
          let authUser = false;
          if(userEmail == contentData[0].user_email) authUser = true;
          let data = {
            id : contentData[0].myrecipe_id,
            imageUrl : contentData[0].myrecipe_image_url,
            writerEmail : contentData[0].user_email,
            title : contentData[0].myrecipe_title,
            saveCount : contentData[0].myrecipe_count,
            checkSaveList : false,
            content : contentData[0].myrecipe_text,
            writerAuth : authUser
          };
          callback(null, data,userEmail ,connection);
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
      for(let i = 0 ; i < saveData.length; i++){
        if(data.id == saveData[i].my_savelist_origin_id){
          data.checkSaveList = true;
        }
      }
      callback(null,data, connection);
    },
    function(contentData, connection, callback){
      let getCommentQuery = 'select * from my_recipe_comment '+
      'where myrecipe_id = ? '+
      'order by myrecipe_comment_post_time';
      connection.query(getCommentQuery, contentData.id, function(err, commentData){
        if(err){
          res.status(501).send({
            msg : "501 get recipe photo comment error"
          });
          callback("getCommentQuery err : "+ err, null);
        }
        else{
          let comment_list = [];
          for(let i = 0 ; i < commentData.length ; i++){
            let data = {
              commentEmail : commentData[i].user_email,
              commentContent : commentData[i].myrecipe_comment_text
            };
            comment_list.push(data);
          }
          callback(null, comment_list, contentData, connection);
        }
      });
    },
    function(commentData, contentData, connection, callback){
      let finalData = {
        RecipePhoto : contentData,
        comment : commentData
      };
      res.status(200).send({
        msg : "Success",
        data : finalData
      });
      connection.release();
      callback(null, "successful find recipe photo content Data");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});

router.post('/comment', function(req, res){
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
      let registCommentQuery = 'insert into my_recipe_comment set ?';
      let data = {
        myrecipe_comment_text : req.body.comment,
        myrecipe_comment_post_time : moment().format('MMMM Do YYYY, h:mm:ss a'),
        myrecipe_id : req.body.id,
        user_email : userEmail
      };
      connection.query(registCommentQuery, data, function(err){
        if(err){
          res.status(501).send({
            msg : "Regist comment err"
          });
          connection.release();
          callback("Regist comment err : "+ err, null);
        }
        else{
          res.status(201).send({
            msg : "Success"
          });
          connection.release();
          callback(null, "Successful writing comment");
        }
      });
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});


module.exports = router;
