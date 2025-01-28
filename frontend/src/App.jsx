import React, { useState,useRef, useEffect } from "react";
import io from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import Board from "./components/Board";
import GameLandingPage from "./pages/GameLandingPage";
// import dotenv from 'dotenv';
// dotenv.config();

const SERVER_URI = import.meta.env.VITE_SERVER_URI;

const socket = io(SERVER_URI);

const App = () => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [player, setPlayer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on("assignPlayer", (assignedPlayer) => {
      setPlayer(assignedPlayer);
      // console.log('player assigned');
    });

    return () => {
      socket.off("assignPlayer");
    };
  }, []);

  const handleRoomCreated = (newRoomId) => {
    setRoomId(newRoomId);
  };

  const handleRoomJoined = (existingRoomId, playerName, assignedPlayer) => {
    setRoomId(existingRoomId);
    setName(playerName)
    // setPlayer(assignedPlayer);
    setIsConnected(true);
  };

  return (
    <div className="container1 bgImg">
      {!isConnected ? (
        <GameLandingPage
          onRoomCreated={handleRoomCreated}
          onRoomJoined={handleRoomJoined}
          socket={socket}
        />
      ) : (
        <Board roomId={roomId} player={player} playerName={name} socket={socket}  />
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};


export default App;