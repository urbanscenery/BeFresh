var express = require('express');
var router = express.Router();
var main = require('./main');
var recipephoto = require('./recipephoto');
var registration = require('./registration');
var recipephotoContent = require('./recipephotoContent');
var restaurant = require('./restaurant');
var restaurantContent = require('./restaurantContent');

router.use('/main', main);
router.use('/recipephoto', recipephoto);
router.use('/recipephoto/registration', registration);
router.use('/recipephoto/content', recipephotoContent);
router.use('/restaurant', restaurant);
router.use('/restaurant/content', restaurantContent);


module.exports = router;
