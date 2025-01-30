const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const app = require('./app');
const Room = require('./models/roomModel');
const {
  createRoom,
  joinRoom,
  makeMove,
  resetGame,
  handleDisconnect
} = require('./gamesSocket/ticTacToe/ticTacToeController');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});


io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Game events
  socket.on("createRoom", (data, callback) => createRoom(data, callback));
  socket.on("joinRoom", (roomId, playerName, callback) => joinRoom(io, socket, roomId, playerName, callback));
  socket.on("makeMove", (data) => makeMove(io, data.roomId, data.state));
  socket.on("resetGame", (data) => resetGame(io, data.roomId, data.state, data.winnerName));
  socket.on("disconnect", () => handleDisconnect(io, socket));
});


const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
