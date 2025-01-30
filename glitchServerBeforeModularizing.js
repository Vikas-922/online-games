const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const moment = require('moment-timezone');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));


const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  players: [String], // Just store player names
  scores: {
    type: Map,
    of: Number,
    default: new Map()
  },
  isActive: { type: Boolean, default: true }
});


const Room = mongoose.model('TicTacToeRoom', roomSchema);

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  feedback: { type: String, required: true },
  formattedTimestamp: {
    type: String,
    default: () => moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A') //  Readable format
  },
  timestamp: {
    type: Date,
    default: () =>moment().tz('Asia/Kolkata').format('YYYY-MM-DD hh:mm:ss A')
  }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

const app = express();
app.use(express.json());

app.use(cors({ origin: '*' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


const rooms = {};



io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", async (_, callback) => {
    const roomId = generateRoomId();
    rooms[roomId] = { players: [] };

    try {
      const newRoom = new Room({
        roomId,
        players: [],
        scores: new Map()
      });
      await newRoom.save();
      callback(roomId);
    } catch (error) {
      console.error("Error creating room:", error);
      callback('error');
    }
  });

  
  socket.on("joinRoom", async (roomId, playerName, callback) => {
    try {
      const room = rooms[roomId];
      if (!room) {
         return callback({ code: "ROOM_NOT_FOUND", message: "Room does not exist." });
      }

      let playersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      if (playersInRoom.length >= 2) {
        return callback({ code: "ROOM_FULL", message: "Room is full. Unable to join." });
      }

      let newPlayerSymbol = null;
      if(playersInRoom.length === 1){
        const obj = findPlayerBySocketId(playersInRoom[0],rooms);
        const existingPlayerSymbol = obj.playerObj.playerSymbol;
        newPlayerSymbol = existingPlayerSymbol==='X' ? 'O' : 'X';
      }
      socket.join(roomId);
      const player = playersInRoom.length === 0 ? "X" 
                      : newPlayerSymbol ? newPlayerSymbol 
                      : "O";
      
      // Only store player 
      rooms[roomId].players.push({socketID: socket.id, playerName, playerSymbol:player});
      
      // Update MongoDB with new player
      await Room.findOneAndUpdate(
        { roomId },
        { 
          $addToSet: { players: playerName },
          $setOnInsert: { [`scores.${playerName}`]: 0 }
        },
        { new: true, upsert: true }
      );

      io.to(socket.id).emit("assignPlayer", player);
      const playerNames = rooms[roomId].players.map(player => player.playerName);
      setTimeout(() => {        
        io.to(roomId).emit("playerJoined", playerNames);
      }, 700);
      
      callback(); // No error, join successful
    } catch (error) {
      console.error("Error joining room:", error);
      callback({ code: "SERVER_ERROR", message: "An unexpected error occurred." });
    }
  });

  
  socket.on("makeMove", async ({ roomId, state }) => {
    try {
      rooms[roomId].state = state;
      io.to(roomId).emit("gameStateUpdate", state, 'NA');
    } catch (error) {
      console.error("Error updating game state:", error);
    }
  });

  
  socket.on("resetGame", async ({ roomId, state, winnerName }) => {
    try {
      rooms[roomId].state = state;
      
      if (winnerName) {
        // Update winner's score in MongoDB
        await Room.findOneAndUpdate(
          { roomId },
          { 
            $inc: { [`scores.${winnerName}`]: 1 }
          }
        );

        // Fetch updated scores to broadcast to players
        const updatedRoom = await Room.findOne({ roomId });
        const scores = mapToObject(updatedRoom.scores);
        
        io.to(roomId).emit("scoresUpdate", scores);
      }

      io.to(roomId).emit("gameStateUpdate", state, 'reset');
    } catch (error) {
      console.error("Error resetting game:", error);
    }
  });

  
  socket.on("disconnect", async () => {
    // console.log("User disconnected:", socket.id);
    const playerDetails = findPlayerBySocketId(socket.id, rooms);
    if (playerDetails) {
      try {
        const playersInRoom = io.sockets.adapter.rooms.get(playerDetails.roomId) 
                ? Array.from(io.sockets.adapter.rooms.get(playerDetails.roomId))
                : [];
        
        // Remove player directly from rooms object
        rooms[playerDetails.roomId].players = rooms[playerDetails.roomId].players.filter(
          player => player.socketID !== socket.id
        );

        
        // Only update active status if both players have left
        if (playersInRoom.length <= 1) {
          // If no players left, remove the room
          if (rooms[playerDetails.roomId].players.length === 0) {
            delete rooms[playerDetails.roomId];
          }
          
          await Room.findOneAndUpdate(
            { roomId: playerDetails.roomId },
            { isActive: false }
          );
        }
        
        socket.to(playerDetails.roomId).emit("playerLeft", playerDetails.playerObj.playerName);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    }
  });
});


//////////////////////////////////////////////////////////////

// Feedback Endpoint (Node 10 compatible)
app.post('/api/feedback', function(req, res) {
  const { name, feedback } = req.body;
  console.log('timeStamp',moment().tz('Asia/Kolkata').format('DD-MM-YYYY hh:mm:ss A'));
  

  const newFeedback = new Feedback({
    name: name || 'Anonymous',
    feedback
  });

  newFeedback.save()
    .then(function() {
      res.status(201).json({ success: true });
    })
    .catch(function(err) {
      console.error('Save error:', err);
      res.status(500).json({ error: 'Server error' });
    });
});



////////////////////////////////////////////////////////////////

const mapToObject = (map) => {
    const obj = {};
    map.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
};


const findPlayerBySocketId = (socketId,rooms) => {
  for (const roomId in rooms) {
    
    const playerObj = rooms[roomId].players.find((ele) => ele.socketID === socketId);
    if (playerObj) {
      return { roomId, playerObj }; // Return both the roomId and the player
    }
  }
  return null; // Return null if no player is found
};


const generateRoomId = (length = 6) => {
  let roomId;
  do {
    roomId = Math.random().toString(36).substr(2, length);
  } while (rooms[roomId]);    
  return roomId;
};



const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});