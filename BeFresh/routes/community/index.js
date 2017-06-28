var express = require('express');
var router = express.Router();
var main = require('./main');
var test = 'test';

router.use('/main', main);


module.exports = router;
