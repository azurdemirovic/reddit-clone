var AnswerModel = require('../models/answerModel.js');

/**
 * answerController.js
 *
 * @description :: Server-side logic for managing answers.
 */
module.exports = {

    /**
     * answerController.create()
     */
    create: function (req, res) {
        if (!req.session.userId) {
            return res.status(401).send('Please login to answer');
        }

        var answer = new AnswerModel({
			content : req.body.content,
			author : req.session.userId,
			question : req.body.questionId
        });

        answer.save(function (err, answer) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating answer',
                    error: err
                });
            }

            return res.redirect('/questions/' + req.body.questionId);
        });
    }
};
