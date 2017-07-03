const schedule = require('node-schedule');
const moment = require('moment');
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const jwt = require('jsonwebtoken');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

var j = schedule.scheduleJob('0 * * * * *', function(){
  console.log(moment().format('MMMM Do YYYY, h:mm:ss a'));
});


//#################################이거 고쳐야함 목요일에 되는걸로!!!
const autoAddDeriveried = schedule.scheduleJob('0 0 0 * * TUE *', function(){
  let currentTime = moment().format('YYYY-MM-DD');
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
      "where recipe_post_time = week(?) and recipe_category = 'W'";
      connection.query(getRecipeQuery, currentTime, function(err, thisweek){
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
      "where recipe_post_time = week(?) and recipe_category = 'V'";
      connection.query(getRecipeQuery, currentTime, function(err, thisweek){
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
    function(vID, wID, connection, callback){
      let getMemberQuery = "select user_email from users "+
      "where user_group = 'W' and user_email not in "+
      "(select user_email from refused where refused_date = week(?));";
      connection.query(getMemberQuery, currentTime, function(err, wellbeingMember){
        if(err){
          connection.release();
          callback("getMemberQuery err :" + err, null);
        }
        else{
          let member = [];
          for(let i = 0; i < wellbeingMember.length; i++){
            member.push(wellbeingMember[i].user_email);
          }
          callback(null, member, vID, wID, connection);
        }
      });
    },
    function(wMember, vID, wID, connection, callback){
      if(wMember.length !== 0){
        let resgistWellbeingDeliveriedQuery = 'insert into delivery values';
        let i;
        for(i = 0 ; i < wMember.length-1; i++){
          resgistWellbeingDeliveriedQuery += " (null, week('"+currentTime + "'), 0, '"+wMember[i] +"', "+wID+'),';
        }
        resgistWellbeingDeliveriedQuery += " (null, week('"+currentTime + "'), 0, '"+wMember[i] +"', "+wID+')';

        connection.query(resgistWellbeingDeliveriedQuery, function(err){
          if(err){
            connection.release();
            callback("resgistWellbeingDeliveriedQuery err :" + err, null);
          }
          else{
            callback(null, vID, wID, connection);
          }
        });
      }
      else callback(null, vID, wID, connection);
    },


    function(vID, wID, connection, callback){
      let getMemberQuery = "select user_email from users "+
      "where user_group = 'V' and user_email not in "+
      "(select user_email from refused where refused_date = week(?));";
      connection.query(getMemberQuery, currentTime, function(err, vegetarianMember){
        if(err){
          connection.release();
          callback("getMemberQuery err :" + err, null);
        }
        else{
          let member = [];
          for(let i = 0; i < vegetarianMember.length; i++){
            member.push(vegetarianMember[i].user_email);
          }
          callback(null, member, vID, wID, connection);
        }
      });
    },
    function(vMember, vID, wID, connection, callback){
      if(vMember.length !== 0){
        let resgistWellbeingDeliveriedQuery = 'insert into delivery values';
        let i;
        for(i = 0 ; i < vMember.length-1; i++){
          resgistWellbeingDeliveriedQuery += " (null, week('"+currentTime + "'), 0, '"+vMember[i] +"', "+vID+'),';
        }
        resgistWellbeingDeliveriedQuery += " (null, week('"+currentTime + "'), 0, '"+vMember[i] +"', "+vID+')';

        connection.query(resgistWellbeingDeliveriedQuery, function(err){
          if(err){
            connection.release();
            callback("resgistWellbeingDeliveriedQuery err :" + err, null);
          }
          else{
            callback(null, vID, wID, connection);
          }
        });
      }
      else callback(null, vID, wID, connection);
    },



    function(vID, wID, connection, callback){
      let getMemberQuery = "select user_email from users "+
      "where user_group = 'B' and user_email not in "+
      "(select user_email from refused where refused_date = week(?));";
      connection.query(getMemberQuery, currentTime, function(err, bothMember){
        if(err){
          connection.release();
          callback("getMemberQuery err :" + err, null);
        }
        else{
          let member = [];
          for(let i = 0; i < bothMember.length; i++){
            member.push(bothMember[i].user_email);
          }
          callback(null, member, vID, wID, connection);
        }
      });
    },
    function(bMember, vID, wID, connection, callback){
      if(bMember.length !== 0){
        let resgistWellbeingDeliveriedQuery = 'insert into delivery values';
        let i;
        for(i = 0 ; i < bMember.length-1; i++){
          resgistWellbeingDeliveriedQuery += " (null, week('"+currentTime + "'), 0, '"+bMember[i] +"', "+vID+'),';
          resgistWellbeingDeliveriedQuery += " (null, week('"+currentTime + "'), 0, '"+bMember[i] +"', "+wID+'),';
        }
        resgistWellbeingDeliveriedQuery += " (null, week('"+currentTime + "'), 0, '"+bMember[i] +"', "+vID+'),';
        resgistWellbeingDeliveriedQuery += " (null, week('"+currentTime + "'), 0, '"+bMember[i] +"', "+wID+')';

        connection.query(resgistWellbeingDeliveriedQuery, function(err){
          if(err){
            connection.release();
            callback("resgistWellbeingDeliveriedQuery err :" + err, null);
          }
          else{
            callback(null, connection);
          }
        });
      }
      else callback(null, connection);
    },


    function(connection, callback){
      let updatePointQuery = "update users set user_point = user_point+500 where user_group = 'W' and user_email not in (select user_email from refused where refused_date = week('"+currentTime +"'));";
      connection.query(updatePointQuery, function(err){
        if(err){
          connection.release();
          callback("updatePointQuery err :" + err, null);
        }
        else callback(null, connection);
      });
    },
    function(connection, callback){
      let updatePointQuery = "update users set user_point = user_point+500 where user_group = 'V' and user_email not in (select user_email from refused where refused_date = week('"+currentTime +"'));";
      connection.query(updatePointQuery, function(err){
        if(err){
          connection.release();
          callback("updatePointQuery err :" + err, null);
        }
        else callback(null, connection);
      });
    },
    function(connection, callback){
      let updatePointQuery = "update users set user_point = user_point+500 where user_group = 'B' and user_email not in (select user_email from refused where refused_date = week('"+currentTime +"'));";
      connection.query(updatePointQuery, function(err){
        if(err){
          connection.release();
          callback("updatePointQuery err :" + err, null);
        }
        else callback(null, connection);
      });
    },

    function(connection, callback){
      connection.release();
      callback(null, "OK");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err){
      err = moment().format('MM/DDahh:mm:ss//') + err;
      console.log("################# ADD Deliveried ERROR!!!#########################");
      console.log(err);
    }
    else{
      result = moment().format('MM/DDahh:mm:ss//') + result;
      console.log("###################ADD Deliveried DATA #########################");
      console.log(result);
    }
  });
});
