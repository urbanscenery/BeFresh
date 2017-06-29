var express = require('express');
var router = express.Router();
var main = require('./main');
var wellbeingFilter = require('./wellbeingFilter');
var vegetarianFilter = require('./vegetarianFilter');
var content = require('./content');
var card = require('./card');
var review = require('./review');
var search = require('./search');


router.use('/main', main);
router.use('/filter/wellbeing',wellbeingFilter);
router.use('/filter/vegetarian', vegetarianFilter);
router.use('/content',content);
router.use('/content/card', card);
router.use('/content/review', review);
router.use('/search', search);


module.exports = router;
