const { generateRoomId, findPlayerBySocketId, mapToObject } = require('./ticTacToeUtils');
const Room = require('../../models/roomModel');

let rooms = {}; // Store rooms in memory, can be changed to DB as per requirements

// Handle creating a new room
const createRoom = async (_, callback) => {
  const roomId = generateRoomId(rooms);
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
};

// Handle joining an existing room
const joinRoom = async (io,socket, roomId, playerName, callback) => {
  try {
    const room = rooms[roomId];
    if (!room) {
      return callback({ code: "ROOM_NOT_FOUND", message: "Room does not exist." });
    }

    let playersInRoom = Array.from(socket.adapter.rooms.get(roomId) || []);
    if (playersInRoom.length >= 2) {
      return callback({ code: "ROOM_FULL", message: "Room is full. Unable to join." });
    }

    let newPlayerSymbol = null;
    if (playersInRoom.length === 1) {
      const obj = findPlayerBySocketId(playersInRoom[0], rooms);
      const existingPlayerSymbol = obj.playerObj.playerSymbol;
      newPlayerSymbol = existingPlayerSymbol === 'X' ? 'O' : 'X';
    }
    
    socket.join(roomId);
    const player = playersInRoom.length === 0 ? "X" : newPlayerSymbol || "O";

    rooms[roomId].players.push({ socketID: socket.id, playerName, playerSymbol: player });
    
    // Update MongoDB with new player
    await Room.findOneAndUpdate(
      { roomId },
      { $addToSet: { players: playerName }, $setOnInsert: { [`scores.${playerName}`]: 0 } },
      { new: true, upsert: true }
    );

    io.to(socket.id).emit("assignPlayer", player);

    //providing all players in room, opponent player filtered at frontend
    const playerNames = rooms[roomId].players.map(player => player.playerName);
    // if there is a lag at frontend so after, within this time the the UI may loaded completel
    setTimeout(() => {
        io.to(roomId).emit("playerJoined", playerNames);
    }, 700);

    callback(); // No error, join successful
  } catch (error) {
    console.error("Error joining room:", error);
    callback({ code: "SERVER_ERROR", message: "An unexpected error occurred." });
  }
};

// Handle making a move
const makeMove = async (io, roomId, state) => {
  try {
    rooms[roomId].state = state;
    io.to(roomId).emit("gameStateUpdate", state, 'NA');
  } catch (error) {
    console.error("Error updating game state:", error);
  }
};

// Handle resetting the game and updating scores
const resetGame = async (io, roomId, state, winnerName) => {
  try {
    rooms[roomId].state = state;

    if (winnerName) {
        // Update winner's score in MongoDB
      await Room.findOneAndUpdate(
        { roomId },
        { $inc: { [`scores.${winnerName}`]: 1 } }
      );

      const updatedRoom = await Room.findOne({ roomId });
      const scores = Object.fromEntries(updatedRoom.scores);
    //   const scores = mapToObject(updatedRoom.scores);  //for node v10
      io.to(roomId).emit("scoresUpdate", scores);
    }

    io.to(roomId).emit("gameStateUpdate", state, 'reset');
  } catch (error) {
    console.error("Error resetting game:", error);
  }
};

// Handle disconnect
const handleDisconnect = async (io, socket) => {
  const playerDetails = findPlayerBySocketId(socket.id, rooms);
  if (playerDetails) {
    try {
      // const playersInRoom = io.sockets.adapter.rooms.get(playerDetails.roomId) /// if not using namespace for io
      const playersInRoom = io.adapter.rooms.get(playerDetails.roomId) /// if using namespace for io
        ? Array.from(io.adapter.rooms.get(playerDetails.roomId))
        : [];
      
      rooms[playerDetails.roomId].players = rooms[playerDetails.roomId].players.filter(
        player => player.socketID !== socket.id
      );
      
      if (playersInRoom.length < 1) {
        // If no players left, remove the room
        if (rooms[playerDetails.roomId].players.length === 0) {
          delete rooms[playerDetails.roomId];
        }
        
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

  console.log("User disconnected:", socket.id);
};

module.exports = { createRoom, joinRoom, makeMove, resetGame, handleDisconnect };
