var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController.js');

/*
 * GET
 */
router.get('/register', userController.showRegister);
router.get('/login', userController.showLogin);
router.get('/logout', userController.logout);
router.get('/profile', userController.profile);
router.get('/:id', userController.profile);

/*
 * POST
 */
router.post('/', userController.create);
router.post('/login', userController.login);
router.post('/update', userController.upload.single('profileImage'), userController.update);

module.exports = router;
