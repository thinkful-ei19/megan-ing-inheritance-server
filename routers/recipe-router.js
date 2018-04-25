'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const {Recipe} = require('../models/recipe');
const router = express.Router();
const jsonParser = bodyParser.json();
const mongoose = require('mongoose');



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

  

router.post('/recipes', jsonParser, (req, res) => {
  const requiredFields = ['title', 'ingredients', 'recipe'];
  const missingField = requiredFields.find(field => !(field in req.body));
  // const userId = req.user.id;
  
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
    // userId
  })
    .then(result => {
      res.location(`${req.originalUrl}/${result._id}`).status(201).json(result);
      console.log(result._id);
    })
    .catch(err => {
      console.log(err);
      return res.status(err.code).json(err);
    });
});
  
  
module.exports = router;