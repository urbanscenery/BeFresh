var express = require('express');
var router = express.Router();
var login = require('./login/login');
var signin = require('./login/signin');
var membership = require('./membership/index');
var community = require('./community/index');
var recipe = require('./recipe/index');
var mypage = require('./mypage/index');
var upload = require('./upload/index');

router.use('/login', login);
router.use('/signin', signin);
router.use('/membership', membership);
router.use('/community', community);
router.use('/recipe', recipe);
router.use('/mypage', mypage);
router.use('/upload', upload);


module.exports = router;
