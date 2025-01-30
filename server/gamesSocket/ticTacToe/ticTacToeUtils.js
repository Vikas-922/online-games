// Generate a random room ID (can be changed to more sophisticated generation logic)
const generateRoomId = (rooms,length = 8) => {
  let roomId;
  do {
    roomId = Math.random().toString(36).substring(2, length);
  } while (rooms[roomId]);    
  return roomId;
};
  
  // Find a player by their socket ID
  const findPlayerBySocketId = (socketId,rooms) => {
    for (const roomId in rooms) {
      const playerObj = rooms[roomId].players.find((ele) => ele.socketID === socketId);
      if (playerObj) {
        return { roomId, playerObj }; // Return both the roomId and the player
      }      
    }
    return null; // Return null if no player is found
  };
  
  // Convert MongoDB Map to an object
  const mapToObject = (map) => {
    const obj = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  };
  
  module.exports = { generateRoomId, findPlayerBySocketId, mapToObject };
  