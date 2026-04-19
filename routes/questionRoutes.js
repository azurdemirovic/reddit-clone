var express = require('express');
var router = express.Router();
var questionController = require('../controllers/questionController.js');

/*
 * GET
 */
router.get('/', questionController.list);
router.get('/new', questionController.new);
router.get('/hot', questionController.hot);
router.get('/:id', questionController.show);

/*
 * POST
 */
router.post('/', questionController.create);
router.post('/:questionId/accept/:answerId', questionController.accept);

module.exports = router;
