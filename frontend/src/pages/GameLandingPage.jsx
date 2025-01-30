import React, { useState,useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { roomHandlers } from "../utility/socketUtils";


const GameLandingPage = ({ onRoomCreated, onRoomJoined,socket,setGlobalName }) => {
    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState("");
    const [createdRoomId, setCreatedRoomId] = useState(null);
  
    const createRoom = () => {
      // console.log("Creating room...");
      socket.emit("createRoom", null, (newRoomId) => {
        if (newRoomId==='error') {
          toast.error("Failed to create room.", { icon: "⚠️" });
        }
        setCreatedRoomId(newRoomId);
        setRoomId(newRoomId);
        toast.success(`Room created successfully!`);
        onRoomCreated(newRoomId);
        roomHandlers.copyRoomId(newRoomId);
        // console.log("New Room ID:", newRoomId);
      });
    };
  
    const joinRoom = () => {
      if (roomId.trim()) {
        // console.log("Joining room...", roomId);
        socket.emit("joinRoom", roomId, name, (error) => {
          if (error) {
            switch (error.code) {
                case "ROOM_NOT_FOUND":
                    toast.error("Room not found! Please check the ID.", { icon: "❌" });
                    break;
                case "ROOM_FULL":
                    toast.error("Room is full! Try another one.", { icon: "🚫" });
                    break;
                case "SERVER_ERROR":
                    toast.error("Something went wrong! Try again later.", { icon: "⚠️" });
                    break;
                default:
                    toast.error("Unknown error occurred!", { icon: "❓" });
            }
            return ;
          } else {
            toast.success("Successfully joined the room!");
            // onRoomJoined(roomId,name, "O");
            onRoomJoined(roomId,name, "O");
          }
        });      
        
      } else {
        toast.error("Please enter a valid Room ID.", { icon: "⚠️" });
      }
    };
  

    return (
      <>
        <h1 className="heading">Tic Tac Toe</h1>  
        <input
          type="text"
          placeholder="Enter Your Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setGlobalName(e.target.value);
          }}
          className="input"          
        />
  
        {/* <div className="flex-col-center join-room-container" > */}
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="input"
            disabled={!name.trim()} 
          />
  
          {/* Join Room Button */}
          <button
            className="btn btn2"
            onClick={joinRoom}
            disabled={!name.trim()} 
          >
            Join Room
          </button>
        {/* </div> */}

        {/* Create Room Button */}
        {createdRoomId ? (
          <div className="room-status">
            Share RoomID: <strong>{createdRoomId}</strong>
          </div>
        ) : (
          <button
            className="btn btn-green"
            onClick={createRoom}
            disabled={!name.trim()} 
          >
            Create Room
          </button>
        )}

      </>
    );
  };


  export default GameLandingPage;
  