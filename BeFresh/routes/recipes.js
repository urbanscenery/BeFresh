//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const multer = require('multer');
const async = require('async');
const multerS3 = require('multer-s3');
const router = express.Router();
const fs = require('fs');
const moment = require('moment');
//const config = JSON.parse(fs.readFileSync('./config/aws_config.json'));
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db_pool');
const s3 = new aws.S3();
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'befreshrecipes',
        acl: 'public-read',
        key: function(req, file, cb) {
            cb(null, Date.now() + '.' + file.originalname.split('.').pop());
        }
    })
});

router.post('/', upload.array('image_list',15), function(req, res){
  let task_array = [
    function(callback){
			pool.getConnection(function(err, connection){
				if(err) callback("getConnection err : "+ err, null);
				else callback(null, connection);
			});
		},
    function(connection, callback){
      let query_post_recipe = 'insert into recipes set ?';
      let imageUrlList;
      for(let i = 0; i < 15 ; i++){
        if(req.file)  imageUrlList[i] = req.file.location;
        else  imageUrlList[i] = null;
      }
      let record = {
        recipe_title : req.body.title,
        recipe_subtitle : req.body.subtitle,
        recipe_cookingTime : req.body.cookingTime,
        recipe_difficulty : req.body.difficulty,
        recipe_description : req.body.description,
        recipe_method : req.body.method,
        recipe_category : req.body.category,
        recipe_image_url_0 : imageUrlList[0],
        recipe_image_url_1 : imageUrlList[1],
        recipe_image_url_2 : imageUrlList[2],
        recipe_image_url_3 : imageUrlList[3],
        recipe_image_url_4 : imageUrlList[4],
        recipe_image_url_5 : imageUrlList[5],
        recipe_image_url_6 : imageUrlList[6],
        recipe_image_url_7 : imageUrlList[7],
        recipe_image_url_8 : imageUrlList[8],
        recipe_image_url_9 : imageUrlList[9],
        recipe_image_url_10 : imageUrlList[10],
        recipe_image_url_11 : imageUrlList[11],
        recipe_image_url_12 : imageUrlList[12],
        recipe_image_url_13 : imageUrlList[13],
        recipe_image_url_14 : imageUrlList[14]
      };
      connection.qurey.
    }
  ];
});
