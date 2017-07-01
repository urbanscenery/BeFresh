const schedule = require('node-schedule');
const moment = require('moment');
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db_pool');

var j = schedule.scheduleJob('0 0 0 ? * THU *', function(){
  console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));
});


const autoAddDeriveried = schedule.scheduleJob('0 0 0 ? * THU *', function(){
  let task_array = [
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
      let getRecipeQuery = 'select recipe_id from recipes '+
      'where recipe_post_time = week(?) and recipe_category = ?';
      let currentTime = moment().format('YYYY-MM-DD');
      connection.query(getRecipeQuery, [currentTime, 'W'], function(err, thisweek){
        if(err){
          connection.release();
          callback("getRecipeQuery err :" + err, null);
        }
        else{
          let wellbeingID;
          if(thisweek.length === 0){
            wellbeingID = 0;
          }
          else wellbeingID = thisweek[0].recipe_id;
          callback(null, wellbeingID, connection);
        }
      });
    },
    function(wellbeingID, connection, callback){
      let getRecipeQuery = 'select recipe_id from recipes '+
      'where recipe_post_time = week(?) and recipe_category = ?';
      let currentTime = moment().format('YYYY-MM-DD');
      connection.query(getRecipeQuery, [currentTime, 'V'], function(err, thisweek){
        if(err){
          connection.release();
          callback("getRecipeQuery err :" + err, null);
        }
        else{
          let vegetarianID;
          if(thisweek.length === 0){
            vegetarianID = 0;
          }
          else vegetarianID = thisweek[0].recipe_id;
          callback(null, vegetarianID, wellbeingID, connection);
        }
      });
    },
    

  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});
