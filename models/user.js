'use strict';
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const bcrypt = require('bcryptjs');


const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {type: String, default: ''}
});

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

UserSchema.methods.serialize = function() {
  return {
    username: this.username || '',
    firstName: this.firstName || ''
  };
};
//Note to self: To serialize an object means to convert its state to a byte stream 
//so way that the byte stream can be reverted back into a copy of the object.

UserSchema.methods.checkPassword = function(password) {
  return bcrypt.compare(password, this.password);
};


const User = mongoose.model('User', UserSchema);

module.exports = {User};