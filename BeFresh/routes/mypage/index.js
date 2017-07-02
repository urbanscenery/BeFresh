var express = require('express');
var router = express.Router();
var registSavelist = require('./savelist');
var recipe = require('./recipe');
var accountinfo = require('./accountinfo');

router.use('/registmylist', registSavelist);
router.use('/recipe', recipe);
router.use('/accountinfo', accountinfo);

module.exports = router;
