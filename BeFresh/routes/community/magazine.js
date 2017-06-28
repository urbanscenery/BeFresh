//52.78.124.103:3000/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
const fs = require('fs');
const jwt = require('jsonwebtoken');
//const config = JSON.parse(fs.readFileSync('./config/aws_config.json'));
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../../config/db_pool');

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
          callback("JWT decoded err : "+ err, null);
        }
        else callback(null, decoded.user_email, connection);
      });
    },
    function(userEmail, connection, callback){
      let getMagazineQuery = 'select * from magazine '+
      'order by magazine_post_time '+
      'limit 6';
      let data_list = [];
      connection.query(getMagazineQuery, function(err,magazineData){
        if(err){
          res.status(501).send({
            msg : "501 get magazine error"
          });
          callback("getMagazineQuery err : "+ err, null);
        }
        else{
          for(let i = 0 ; i < magazineData.length ; i++){
            let data;
            //매거진 콘텐츠 길이 제한하는거 서버가 해야하나?
            data = {
              id : magazineData[i].magazine_id,
              imageUrl : magazineData[i].magazine_image_url,
              title : magazineData[i].magazine_title,
              content : magazineData[i].magazine_text,
              checkSaveList : false
            };
            data_list.push(data);
          }
          callback(null, data_list, connection);
        }
      });
    },
    function(magazineData, connection, callback){
      res.status(200).send({
        msg : "Success",
        data : magazineData
      });
      connection.release();
      callback(null, "successful find magazine data");
    }
  ];
  async.waterfall(task_array, function(err, result) {
    if (err) console.log(err);
    else console.log(result);
  });
});




module.exports = router;
