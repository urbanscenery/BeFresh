var express = require('express');
var router = express.Router();
var registSavelist = require('./savelist');

router.use('/registmylist', registSavelist);

module.exports = router;
