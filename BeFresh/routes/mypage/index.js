var express = require('express');
var router = express.Router();
var registSavelist = require('./savelist');
var recipe = require('./recipe');

router.use('/registmylist', registSavelist);
router.use('/recipe', recipe);

module.exports = router;
