//52.78.124.103:3412/lists
const express = require('express');
const aws = require('aws-sdk');
const async = require('async');
const router = express.Router();
//const config = JSON.parse(fs.readFileSync('./config/aws_config.json'));
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db_pool');
