import React, { useState,useRef, useEffect } from "react";
import io from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import Board from "./components/Board";
import GameLandingPage from "./pages/GameLandingPage"; // Icons from react-icons
import Feedback from "./components/Feedback";


const SERVER_URI = import.meta.env.VITE_SERVER_URI;

const socket = io(`${SERVER_URI}/tic-tac-toe`);

const App = () => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [player, setPlayer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);


  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(false);
      toast.success('Connected to game server', {
        icon: '🎮'
      });
    });

    socket.on("assignPlayer", (assignedPlayer) => {
      setPlayer(assignedPlayer);
      // console.log('player assigned');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Lost connection to game server', {
        icon: '❌'
      });
    });

    // Handle page refresh (force disconnect)
    const handleUnload = () => {
      socket.disconnect();
    };

    // window.addEventListener("beforeunload", handleUnload);
    
    return () => {
      socket.off("assignPlayer");
      socket.off("connect");
      socket.off("disconnect");
      // Clean up the event listener
      document.removeEventListener("mousedown", handleClickOutside);
      // window.removeEventListener("beforeunload", handleUnload);
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
          setGlobalName={setName}
          socket={socket}
        />
      ) 
      : (
        <Board roomId={roomId} player={player} playerName={name} socket={socket}  />
      )}
      
      {/* Feedback Button and Textbox */}
      <Feedback name={name} />

      <Toaster position="top-center" reverseOrder={true} />
    </div>
  );
};


export default App;