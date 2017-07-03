var express = require('express');
var router = express.Router();
var registSavelist = require('./savelist');
var recipe = require('./recipe');
var accountinfo = require('./accountinfo');
var test = require('./test');

router.use('/registmylist', registSavelist);
router.use('/recipe', recipe);
router.use('/accountinfo', accountinfo);
router.use('/test', test);

module.exports = router;
