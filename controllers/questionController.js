var QuestionModel = require('../models/questionModel.js');
var AnswerModel = require('../models/answerModel.js');

/**
 * questionController.js
 *
 * @description :: Server-side logic for managing questions.
 */
module.exports = {

    /**
     * questionController.list()
     */
    list: function (req, res) {
        QuestionModel.find()
            .populate('author')
            .sort({ createdAt: -1 })
            .exec(function (err, questions) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when getting question.',
                        error: err
                    });
                }
                
                // Get answer counts for each
                var promises = questions.map(q => {
                    return AnswerModel.countDocuments({ question: q._id }).then(count => {
                        q.answerCount = count;
                        return q;
                    });
                });

                Promise.all(promises).then(results => {
                    return res.render('question/list', { questions: results });
                });
            });
    },

    /**
     * questionController.show()
     */
    show: function (req, res) {
        var id = req.params.id;

        QuestionModel.findOne({_id: id})
            .populate('author')
            .populate('acceptedAnswer')
            .exec(function (err, question) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when getting question.',
                        error: err
                    });
                }
                if (!question) {
                    return res.status(404).json({
                        message: 'No such question'
                    });
                }

                // Increment views
                question.views++;
                question.save();

                // Get answers
                AnswerModel.find({ question: id })
                    .populate('author')
                    .sort({ createdAt: 1 })
                    .exec(function (err, answers) {
                        if (err) {
                            return res.status(500).json({
                                message: 'Error when getting answers.',
                                error: err
                            });
                        }

                        // Filter out accepted answer if it exists to show it at the top separately
                        var acceptedAnswer = null;
                        var otherAnswers = answers.filter(a => {
                            if (question.acceptedAnswer && a._id.toString() === question.acceptedAnswer._id.toString()) {
                                acceptedAnswer = a;
                                return false;
                            }
                            return true;
                        });

                        return res.render('question/show', { 
                            question: question, 
                            acceptedAnswer: acceptedAnswer,
                            answers: otherAnswers 
                        });
                    });
            });
    },

    new: function (req, res) {
        if (!req.session.userId) {
            return res.redirect('/users/login');
        }
        return res.render('question/new');
    },

    /**
     * questionController.create()
     */
    create: function (req, res) {
        if (!req.session.userId) {
            return res.redirect('/users/login');
        }

        var question = new QuestionModel({
			title : req.body.title,
			description : req.body.description,
			author : req.session.userId
        });

        question.save(function (err, question) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating question',
                    error: err
                });
            }

            return res.redirect('/questions');
        });
    },

    accept: function (req, res) {
        var questionId = req.params.questionId;
        var answerId = req.params.answerId;

        QuestionModel.findOne({ _id: questionId }, function (err, question) {
            if (err || !question) return res.status(404).send('Question not found');
            
            // Check if user is author
            if (question.author.toString() !== req.session.userId.toString()) {
                return res.status(403).send('Only author can accept answer');
            }

            question.acceptedAnswer = answerId;
            question.save(function (err) {
                if (err) return res.status(500).send('Error accepting answer');
                
                // Also mark the answer as accepted
                AnswerModel.findOne({ _id: answerId }, function (err, answer) {
                    if (answer) {
                        answer.isAccepted = true;
                        answer.save();
                    }
                    return res.redirect('/questions/' + questionId);
                });
            });
        });
    },

    hot: function (req, res) {
        // Phase 4 implementation
        QuestionModel.find()
            .populate('author')
            .exec(function (err, questions) {
                if (err) return res.status(500).send(err);

                // Sort by activity: (views + answers_count * 5)
                // We'll need answers count. For now simple sort.
                // In Phase 4 we'll improve this.
                
                // Let's get answer counts for each question
                var promises = questions.map(q => {
                    return AnswerModel.countDocuments({ question: q._id }).then(count => {
                        q.answerCount = count;
                        q.hotness = q.views + count * 5;
                        return q;
                    });
                });

                Promise.all(promises).then(results => {
                    results.sort((a, b) => b.hotness - a.hotness);
                    return res.render('question/hot', { questions: results });
                });
            });
    }
};
