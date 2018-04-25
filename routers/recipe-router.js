'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const {Recipe} = require('../models/recipe');
const router = express.Router();
const jsonParser = bodyParser.json();


router.get('/recipes', (req, res, next)=>{
  return Recipe.find()
    .then(results=> res.json(results))
    .catch(err=> next(err));
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
    .then(() => {
      return res.status(201);
    })
    .catch(err => {
      console.log(err);
      return res.status(err.code).json(err);
    });
});
  
  
module.exports = router;