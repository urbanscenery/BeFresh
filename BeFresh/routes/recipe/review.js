//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
const moment = require('moment');
//const config = JSON.parse(fs.readFileSync('./config/aws_config.json'));
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
    if (err) console.log(err);
    else console.log(result);
  });
});




module.exports = router;
