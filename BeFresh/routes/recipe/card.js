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
      let getCardQuery = 'select recipe_method from recipes where recipe_id = ?';
      connection.query(getCardQuery, req.params.id, function(err, recipeData){
        if(err){
          res.status(501).send({
            msg : "501 get Recipe method error"
          });
          callback("getCardQuery err : "+ err, null);
        }
        else{
          let method = JSON.parse(recipeData[0].recipe_method);
          callback(null, method, connection);
        }
      });
    },
    function(method, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : method
      });
      connection.release();
      callback(null, "successful send data");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});




module.exports = router;
