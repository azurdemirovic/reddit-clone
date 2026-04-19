var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var answerSchema = new Schema({
	'content' : { type: String, required: true },
	'author' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user',
        required: true
	},
	'question' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'question',
        required: true
	},
	'createdAt' : { type: Date, default: Date.now },
	'isAccepted' : { type: Boolean, default: false }
});

module.exports = mongoose.model('answer', answerSchema);
