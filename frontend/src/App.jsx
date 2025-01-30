import React, { useState,useRef, useEffect } from "react";
import io from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import Board from "./components/Board";
import GameLandingPage from "./pages/GameLandingPage";
import { FaCommentDots, FaPaperPlane } from "react-icons/fa"; // Icons from react-icons


const SERVER_URI = import.meta.env.VITE_SERVER_URI;

const socket = io(SERVER_URI);

const App = () => {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [player, setPlayer] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFeedbackExpanded, setFeedbackExpanded] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const feedbackRef = useRef(null); // Ref for the feedback section


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


    const handleClickOutside = (event) => {
      if (feedbackRef.current && !feedbackRef.current.contains(event.target)) {
        setFeedbackExpanded(false); // Collapse the feedback section
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      socket.off("assignPlayer");
      // Clean up the event listener
      document.removeEventListener("mousedown", handleClickOutside);
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


  const handleFeedbackSubmit = () => {
    if (feedbackText.trim()) {
      console.log("Feedback submitted:", feedbackText);
      // Add your logic to send feedback (e.g., API call, socket emit, etc.)
      setFeedbackText(""); // Clear the textbox
      setFeedbackExpanded(false); // Collapse the feedback section
    }
  };

  // Ensure the textbox is visible when the keyboard appears
  useEffect(() => {
    if (isFeedbackExpanded && feedbackRef.current) {
      feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isFeedbackExpanded]);



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
      {/* Feedback Button and Textbox */}
      <div
        ref={feedbackRef}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          zIndex: 1000, // Ensure it's above other elements
        }}
      >
      
      {isFeedbackExpanded ? (
      <div className="feedback-box show">
        <input
          type="text"
          placeholder="Your feedback..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          className="feedback-input"
        />
        <button onClick={handleFeedbackSubmit} className="feedback-send-btn">
          <FaPaperPlane /> Send
        </button>
      </div>
      ) : (
      <button
        onClick={() => setFeedbackExpanded(true)}
        className="feedback-toggle-btn"
      >
        <FaCommentDots size={20} />
      </button>
    )}
    </div>

      <Toaster position="top-center" reverseOrder={true} />
    </div>
  );
};


export default App;