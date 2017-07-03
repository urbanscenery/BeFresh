var express = require('express');
var router = express.Router();
var registSavelist = require('./savelist');
var recipe = require('./recipe');
var accountinfo = require('./accountinfo');
var deliveried = require('./deliveried');

router.use('/registmylist', registSavelist);
router.use('/savedrecipe', recipe);
router.use('/deliveriedrecipe', deliveried);
router.use('/accountinfo', accountinfo);

module.exports = router;
