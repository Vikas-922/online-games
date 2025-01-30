const express = require('express');
const cors = require('cors');
const feedbackRoutes = require('./routes/feedbackRoutes');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('dotenv').config();

const app = express();

// Middleware setup
app.use(express.json());
app.use(cors({ origin: '*' }));

// MongoDB connection
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));


// Feedback Routes
app.use('/api', feedbackRoutes);


// Server setup
module.exports = app;
