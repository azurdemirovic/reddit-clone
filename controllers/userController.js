var UserModel = require('../models/userModel.js');
var multer = require('multer');
var path = require('path');

// Multer storage
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});
var upload = multer({ storage: storage });

/**
 * userController.js
 *
 * @description :: Server-side logic for managing users.
 */
module.exports = {

    showRegister: function (req, res) {
        return res.render('user/register', { error: null });
    },

    showLogin: function (req, res) {
        return res.render('user/login', { error: null });
    },

    /**
     * userController.create()
     */
    create: function (req, res) {
        if (!req.body.username || !req.body.email || !req.body.password) {
            return res.render('user/register', { error: 'All fields are required.' });
        }

        var user = new UserModel({
			username : req.body.username,
			email : req.body.email,
			password : req.body.password,
            profileImage: 'default-avatar.png'
        });

        user.save(function (err, user) {
            if (err) {
                return res.render('user/register', { error: 'Registration failed. Username or email might already be taken.' });
            }

            return res.redirect('/users/login');
        });
    },

    login: function (req, res, next) {
        UserModel.authenticate(req.body.username, req.body.password, function (error, user) {
            if (error || !user) {
                return res.render('user/login', { error: 'Wrong username or password.' });
            } else {
                req.session.userId = user._id;
                req.session.userName = user.username;
                return res.redirect('/');
            }
        });
    },

    logout: function (req, res, next) {
        if (req.session) {
            // delete session object
            req.session.destroy(function (err) {
                if (err) {
                    return next(err);
                } else {
                    return res.redirect('/');
                }
            });
        }
    },

    profile: function (req, res, next) {
        var id = req.params.id || req.session.userId;
        if (!id) {
            return res.redirect('/users/login');
        }

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting user.',
                    error: err
                });
            }

            if (!user) {
                return res.status(404).json({
                    message: 'No such user'
                });
            }

            // Calculate stats
            var QuestionModel = require('../models/questionModel');
            var AnswerModel = require('../models/answerModel');

            Promise.all([
                QuestionModel.countDocuments({ author: id }),
                AnswerModel.countDocuments({ author: id }),
                AnswerModel.countDocuments({ author: id, isAccepted: true })
            ]).then(([qCount, aCount, acceptedCount]) => {
                return res.render('user/profile', { 
                    profile: user,
                    stats: {
                        questions: qCount,
                        answers: aCount,
                        accepted: acceptedCount
                    }
                });
            }).catch(err => {
                return res.status(500).send(err);
            });
        });
    },

    update: function (req, res) {
        var id = req.session.userId;
        if (!id) return res.status(401).send();

        UserModel.findOne({_id: id}, function (err, user) {
            if (err) return res.status(500).send(err);
            
            if (req.body.bio) user.bio = req.body.bio;
            if (req.file) user.profileImage = req.file.filename;

            user.save(function (err) {
                if (err) return res.status(500).send(err);
                return res.redirect('/users/profile');
            });
        });
    },

    upload: upload
};
