var express = require('express');
var router = express.Router();
var login = require('./login/login');
var signin = require('./login/signin');
var membership = require('./membership/index');
var community = require('./community/index');
var recipe = require('./recipe/index');

router.use('/login', login);
router.use('/signin', signin);
router.use('/membership', membership);
router.use('/community', community);
router.use('/recipe', recipe);


module.exports = router;
