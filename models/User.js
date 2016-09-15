var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

// Schema for local and Facebook users.
var userSchema = new Schema({
    local: {
      email: String,
      password: String,
      first_name: String,
      last_name: String,
      dob: Date
    },
    facebook: {
      id: String,
      name: String,
      email: String,
      token: String
    },
    currentLocation: {
      lat: Number,
      lng: Number
    },
    currentStatus: String,
    socketId: String
});

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}

userSchema.methods.validPassword = function(password) {
  var user = this
  return bcrypt.compareSync(password, user.local.password)
}

var User = mongoose.model('User', userSchema)

module.exports = User
