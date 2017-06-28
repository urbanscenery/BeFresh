var express = require('express');
var router = express.Router();
var check= require('./check');
var info = require('./info');
var join = require('./join');


router.use('/check', check);
router.use('/info', info);
router.use('/join', join);


module.exports = router;
