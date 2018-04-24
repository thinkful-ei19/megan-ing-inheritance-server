'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const {User} = require('../models/user');
const router = express.Router();
const jsonParser = bodyParser.json();

//Note to self: ideas on how to do this from jwt challenge, 
//retyped for understanding and modified based on app and notated for comrehension purposes
router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['username', 'password'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }

  const stringFields = ['username', 'password', 'fullName'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );
  //Note to self: find where a field (username, password, etc...) in the req body is not a string^

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );
  //Note to self: make sure that the trimmed version of a field matches the original version
  //to double check no whitespace (this is also set on the client side to throw an error at the user to warn them)

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    });
  }

  const fieldSizes = {
    username: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };

  const tooSmall = Object.keys(fieldSizes).find(
    field =>
      'min' in fieldSizes[field] &&
            req.body[field].trim().length < fieldSizes[field].min
  );
  const tooBig = Object.keys(fieldSizes).find(
    field =>
      'max' in fieldSizes[field] &&
            req.body[field].trim().length > fieldSizes[field].max
  );

  //Note to self: find a field in the fieldsizes and compare that to a trimmed version of the field being inputted
  //in min it finds ones that are smaller than our set minimum characters
  //in max it finds ones that go over our maximum characters

  if (tooSmall || tooBig) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmall
        ? `Must be at least ${fieldSizes[tooSmall]
          .min} characters long`
        : `Must be at most ${fieldSizes[tooBig]
          .max} characters long`,
      location: tooSmall || tooBig
    });
  }

  let {username, password, fullName = ''} = req.body;
  fullName = fullName.trim();


  return User.find({username})
    .count()
    .then(usersWithThatUsername => {
      if (usersWithThatUsername > 0) {
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      }
      return User.hashPassword(password);
    })
    .then(hashedPassword => {
      return User.create({
        username,
        password: hashedPassword,
        fullName
      });
    })
    .then(user => {
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({code: 500, message: 'Internal server error'});
    });
});


module.exports = {router};