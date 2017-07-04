var express = require('express');
var router = express.Router();
var check= require('./check');
var info = require('./info');
var join = require('./join');
var calender = require('./calender');
var refusedate = require('./refusedate');


router.use('/check', check);
router.use('/info', info);
router.use('/join', join);
router.use('/schedule', calender);
router.use('/refusedate', refusedate);


module.exports = router;
