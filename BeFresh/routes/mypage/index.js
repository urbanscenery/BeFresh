var express = require('express');
var router = express.Router();
var registSavelist = require('./savelist');
var recipe = require('./recipe');
var accountinfo = require('./accountinfo');
var test = require('./test');
var deliveried = require('./deliveried');

router.use('/registmylist', registSavelist);
router.use('/savedrecipe', recipe);
router.use('/accountinfo', accountinfo);
router.use('/deliveriedrecipe', deliveried);
router.use('/test', test);

module.exports = router;
