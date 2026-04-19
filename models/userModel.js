var mongoose = require('mongoose');
var Schema   = mongoose.Schema;
var bcrypt = require('bcrypt');

var userSchema = new Schema({
	'username' : { type: String, required: true, unique: true },
	'email' : { type: String, required: true, unique: true },
	'password' : { type: String, required: true },
	'registrationDate' : { type: Date, default: Date.now },
	'profileImage' : { type: String, default: 'default-avatar.png' },
	'bio' : String
});

// Authenticate input against database
userSchema.statics.authenticate = function (username, password, callback) {
  this.findOne({ username: username })
    .exec(function (err, user) {
      if (err) {
        return callback(err);
      } else if (!user) {
        var err = new Error('User not found.');
        err.status = 401;
        return callback(err);
      }
      bcrypt.compare(password, user.password, function (err, result) {
        if (result === true) {
          return callback(null, user);
        } else {
          return callback();
        }
      });
    });
};

// Hashing a password before saving it to the database
userSchema.pre('save', function (next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  });
});

module.exports = mongoose.model('user', userSchema);
