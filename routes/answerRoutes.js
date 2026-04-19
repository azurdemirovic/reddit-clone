var express = require('express');
var router = express.Router();
var answerController = require('../controllers/answerController.js');

/*
 * POST
 */
router.post('/', answerController.create);

module.exports = router;
