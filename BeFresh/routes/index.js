var express = require('express');
var router = express.Router();
var login = require('./login/login');
var signin = require('./login/signin');
var membership = require('./membership/index');

router.use('/login', login);
router.use('/signin', signin);
router.use('/membership', membership);


module.exports = router;
