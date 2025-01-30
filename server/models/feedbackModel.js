const mongoose = require('mongoose');
const moment = require('moment-timezone');

const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  feedback: { type: String, required: true },
  formattedTimestamp: {
    type: String,
    default: () => moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A') // Readable format
  },
  timestamp: {
    type: Date,
    default: () => moment().tz('Asia/Kolkata').toDate() // Date object
  }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
