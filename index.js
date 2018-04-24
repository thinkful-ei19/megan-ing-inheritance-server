'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const { PORT, CLIENT_ORIGIN } = require('./config');
const { dbConnect } = require('./db-mongoose');
// const {dbConnect} = require('./db-knex');
const bodyParser = require('body-parser');

const app = express();

const recipes = [
  {
    title: 'Grandmas Hashbrowns',
    ingredients: '5 onion, 8 potatoes, 3 eggs',
    recipe:'Shred stuff, cook stuff'
  }
];


app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

app.use(bodyParser.json());

app.get('/api/recipes', (req, res)=>{
  res.json(recipes);
});

app.post('/api/recipes', (req, res)=>{
  const {title, ingredients, recipe}=req.body;
  console.log(title, ingredients, recipe);
  res.json('hello world');
});

function runServer(port = PORT) {
  const server = app
    .listen(port, () => {
      console.info(`App listening on port ${server.address().port}`);
    })
    .on('error', err => {
      console.error('Express failed to start');
      console.error(err);
    });
}

if (require.main === module) {
  dbConnect();
  runServer();
}

module.exports = { app };
