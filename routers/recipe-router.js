'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const {Recipe} = require('../models/recipe');
const router = express.Router();
const jsonParser = bodyParser.json();
const mongoose = require('mongoose');
const passport = require('passport');
const jwtAuth = passport.authenticate('jwt', {session: false});



router.get('/recipes', (req, res, next)=>{
  return Recipe.find()
    .then(results=> res.json(results))
    .catch(err=> next(err));
});

router.get('/recipes/:id', (req, res, next) => {
  const { id } = req.params;
  // const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  Recipe.findOne({ _id: id  })//add userId for jwt
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});



router.post('/recipes', jsonParser, jwtAuth, (req, res) => {
  const requiredFields = ['title', 'ingredients', 'recipe'];
  const missingField = requiredFields.find(field => !(field in req.body));
  const userId = req.user.userId;
  console.log(userId);
  
  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  }
  
  let {title, ingredients, recipe} = req.body;  
  
  return Recipe.create({
    title,
    ingredients,
    recipe,
    userId
  })
    .then(result => {
      res.location(`${req.originalUrl}/${result._id}`).status(201).json(result);
    })
    .catch(err => {
      console.log(err);
      return res.status(err.code).json(err);
    });
});
  
  
router.put('/recipes/:id', (req, res, next) => {
  const { id } = req.params;
  const { title, ingredients, recipe } = req.body;
  // const userId = req.user.id;
  const updateNote = { title, ingredients, recipe };//add userId for jwt

  /***** Never trust users - validate input *****/
  if (!title) {
    const err = new Error('Missing `title` in request body');
    err.status = 400;
    return next(err);
  }
  if (!ingredients) {
    const err = new Error('Missing `ingredients` in request body');
    err.status = 400;
    return next(err);
  }
  if (!recipe) {
    const err = new Error('Missing `recipe` in request body');
    err.status = 400;
    return next(err);
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid');
    err.status = 400;
    return next(err);
  }

  return Recipe.findByIdAndUpdate(id, updateNote, { new: true })
    .then(result => {
      if (result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => next(err));
});

module.exports = router;