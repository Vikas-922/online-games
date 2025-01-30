const mongoose = require('mongoose');
const moment = require('moment-timezone');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },  
  players: [String], // Just store player names
  scores: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  formattedTimestamp: {
    type: String,
    default: () => moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A') // Readable format
  },
});

const Room = mongoose.model('TicTacToeRoom', roomSchema);

module.exports = Room;
