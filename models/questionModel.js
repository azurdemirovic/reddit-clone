var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var questionSchema = new Schema({
	'title' : { type: String, required: true },
	'description' : { type: String, required: true },
	'author' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'user',
        required: true
	},
	'createdAt' : { type: Date, default: Date.now },
	'acceptedAnswer' : {
	 	type: Schema.Types.ObjectId,
	 	ref: 'answer'
	},
	'views' : { type: Number, default: 0 }
});

module.exports = mongoose.model('question', questionSchema);
