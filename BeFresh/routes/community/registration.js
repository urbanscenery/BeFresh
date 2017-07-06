//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const async = require('async');
const multerS3 = require('multer-s3');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
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

router.post('/',upload.single('image'), function(req, res){
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
      let registQuery = 'insert into my_recipe set ?';
      let imageUrl = req.file.location;
      let width = 1;
      let height = 1;
      if(req.body.width !==0) width = req.body.width;
      if(req.body.height !==0) height = req.body.height;
      let data = {
        myrecipe_title : req.body.title,
        myrecipe_text : req.body.content,
        myrecipe_image_url : imageUrl,
        myrecipe_count : 0,
        user_email : userEmail,
        myrecipe_post_time : moment().format('YYYY-MM-DD, h:mm:ss a'),
        myrecipe_image_w : width,
        myrecipe_image_h : height
      };
      connection.query(registQuery, data, function(err){
        if(err){
          res.status(501).send({
            msg : "Regist content err"
          });
          connection.release();
          callback("Regist content err : "+ err, null);
        }
        else{
          res.status(201).send({
            msg : "Success"
          });
          connection.release();
          callback(null, "Successful writing my recipe");
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
