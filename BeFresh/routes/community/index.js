var express = require('express');
var router = express.Router();
var main = require('./main');
var recipephoto = require('./recipephoto');
var registration = require('./registration');
var recipephotoContent = require('./recipephotoContent');
var restaurant = require('./restaurant');
var restaurantContent = require('./restaurantContent');
var magazine = require('./magazine');
var magazineContent = require('./magazineContent');
var savelist = require('./savelist');

router.use('/main', main);
router.use('/recipephoto', recipephoto);
router.use('/recipephoto/registration', registration);
router.use('/recipephoto/content', recipephotoContent);
router.use('/restaurant', restaurant);
router.use('/restaurant/content', restaurantContent);
router.use('/magazine', magazine);
router.use('/magazine/content', magazineContent);
router.use('/savelist', savelist);


module.exports = router;
