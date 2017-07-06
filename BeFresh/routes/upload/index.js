var express = require('express');
var router = express.Router();
var recipe = require('./recipe');

router.use('/recipe', recipe);

module.exports = router;
