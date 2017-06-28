var express = require('express');
var router = express.Router();
var main = require('./main');
var recipephoto = require('./recipephoto');
var registration = require('./registration');
var recipephotoContent = require('./recipephotoContent');

router.use('/main', main);
router.use('/recipephoto', recipephoto);
router.use('/recipephoto/registration', registration);
router.use('/recipephoto/content', recipephotoContent);


module.exports = router;
