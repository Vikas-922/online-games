const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
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

const app = express();
app.use(cors({ origin: '*' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

const generateRoomId = (length = 6) => {
  let roomId;
  do {
    roomId = Math.random().toString(36).substr(2, length);
  } while (rooms[roomId]);    
  return roomId;
};

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
      socket.emit("roomError", "Failed to create room");
    }
  });

  socket.on("joinRoom", async (roomId, playerName) => {
    try {
      const room = rooms[roomId];
      if (!room) {
        socket.emit("roomError", "Room does not exist.");
        return;
      }

      let playersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      if (playersInRoom.length >= 2) {
        socket.emit("roomError", "Room is full. Unable to join.");
        return;
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
        console.log('playerNames====',playerNames);
        
        io.to(roomId).emit("playerJoined", playerNames);
        // io.to(roomId).emit("playerJoined", rooms[roomId].players);
      }, 700);

    } catch (error) {
      console.error("Error joining room:", error);
      socket.emit("roomError", "Failed to join room");
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
        const scores = Object.fromEntries(updatedRoom.scores);
        console.log('scores',scores);
        
        io.to(roomId).emit("scoresUpdate", scores);
      }

      io.to(roomId).emit("gameStateUpdate", state, 'reset');
    } catch (error) {
      console.error("Error resetting game:", error);
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    const playerDetails = findPlayerBySocketId(socket.id, rooms);
    console.log('rooms',rooms);
    if (playerDetails) {
      try {
        // const room = await Room.findOne({ roomId: playerDetails.roomId });
        const playersInRoom = Array.from(io.sockets.adapter.rooms.get(playerDetails.roomId));
        // Only update active status if both players have left
        // if (room.players.length <= 1) {
        // Remove player directly from rooms object
        rooms[playerDetails.roomId].players = rooms[playerDetails.roomId].players.filter(
          player => player.socketID !== socket.id
        );

        
        console.log('playersInRoom',playersInRoom);
        
        if (playersInRoom.length <= 1) {
          // If no players left, remove the room
          if (rooms[playerDetails.roomId].players.length === 0) {
            delete rooms[playerDetails.roomId];
          }
          console.log('isActive: false');
          
          await Room.findOneAndUpdate(
            { roomId: playerDetails.roomId },
            { isActive: false }
          );
        }
        
        // Remove player from players array
        // await Room.findOneAndUpdate(
        //   { roomId: playerDetails.roomId },
        //   { $pull: { players: playerDetails.playerObj.playerName } }
        // );
        
        socket.to(playerDetails.roomId).emit("playerLeft", playerDetails.playerObj.playerName);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    }
  });
});



const findPlayerBySocketId = (socketId,rooms) => {
  for (const roomId in rooms) {
    console.log('======== ',roomId,rooms);
    
    const playerObj = rooms[roomId].players.find((ele) => ele.socketID === socketId);
    console.log('playerObj',playerObj)
    if (playerObj) {
      return { roomId, playerObj }; // Return both the roomId and the player
    }
  }
  return null; // Return null if no player is found
};





const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});