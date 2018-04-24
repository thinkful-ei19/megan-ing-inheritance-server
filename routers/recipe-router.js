'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const {Recipe} = require('../models/recipe');
const router = express.Router();
const jsonParser = bodyParser.json();

router.post('/api/recipes', jsonParser, (req, res) => {
  const requiredFields = ['title', 'ingredients', 'recipe'];
  const missingField = requiredFields.find(field => !(field in req.body));
  
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
    recipe
  })
    .then(() => {
      return res.status(201);
    })
    .catch(err => {
      console.log(err);
      return res.status(err.code).json(err);
    });
});
  
  
module.exports = {router};