import React, { useState,useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Square from "./Square";



const Board = ({roomId,playerName, player,socket}) => {
  // playerName a player X opponetPlayerName s
    const winnerAnnounced = useRef(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const playerRef = useRef(player);
    const [squares, setSquares] = useState(Array(9).fill(null));
    const [isYourTurn, setIsYourTurn] = useState(true);
    const [opponetPlayerName, setopponetPlayerName] = useState('');
    const [scores, setScores] = useState({});
    // const [winnerName, setWinnerName] = useState('');
    


    useEffect(() => {
      playerRef.current = player;
    }, [player]);
    
    // console.log( 'isYourTurn', isYourTurn);

    useEffect(() => {
      socket.on("gameStateUpdate", (state, msg) => {
        // setGameState(state);
        setSquares(state.squares);
        if( state.turnOff===playerRef.current || state.turnOff==='both'  )  setIsYourTurn(true);        
        // console.log('MSG MSG MSG',msg);
        
        if (msg==='reset'){
          winnerAnnounced.current = false;
          toast(`Game Reset!!`, {
            icon: '🔁',
            }); 

        }  // Reset the ref
        // console.log('from server', 'player', playerRef.current,'turnOff',state.turnOff, state.squares );
      });
      // console.log('use effect in board');
      
      socket.on('playerJoined', (Name) => {
        // console.log('inside player joined');
        
        if (Array.isArray(Name)) { // Ensure Name is an array
          const oppPly = Name.find((plyrName) => plyrName !== playerName) || '';
          setopponetPlayerName(oppPly);
          if (oppPly!=='') {
            toast(`${oppPly}, joined.`, {
                icon: '🧑',
            });
          }
          // console.log('Player:', playerName, 'Players in room:', Name, 'Opponent:', oppPly);
        } else {
          console.error('Invalid data received:', Name);
        }
      });

      socket.on('playerLeft', (plyerLeftName) => {
        toast(`${plyerLeftName} Left`, {
          icon: '🛑',
          }); 
          // console.log('opponetPlayerName , plyerLeftName',opponetPlayerName,plyerLeftName,true);          
          setopponetPlayerName(opponetPlayerName => 
            opponetPlayerName===plyerLeftName ? '' : opponetPlayerName
           );
      });

      socket.on('scoresUpdate', (scores) => {
        // console.log('scores',scores);  
        setScores(scores);
      });
  
      return () => {
        socket.off("gameStateUpdate");
        socket.off("playerJoined");
      };
    }, []);

    
    const winner = calculateWinner(squares);
    
    // Show the winner toast once
    useEffect(() => {
      if (winner && !winnerAnnounced.current) {
        toast[winner === player ? 'success' : 'error'](`YOU, ${ winner===player ? 'WON': 'LOSE'}`, {
          position: "top-center",
          duration: 1200, 
          style: {
            marginTop: "45vh",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: "bold",
            padding: "1rem",
            color: winner===player ? 'green': 'red',
          },
        });
        winnerAnnounced.current = true; // Mark as announced
      }
    }, [winner]);
  

    const handleClick = (index) => {
      if (squares[index] || calculateWinner(squares)) return;
      // console.log('player',player, 'isYourTurn',isYourTurn);
      
      // if ((player === "X" && isXNext) || (player === "O" && !isXNext)) {
      if ((isYourTurn)) {
        const nextSquares = [...squares];
        nextSquares[index] = player==='X' ? "X" : "O";
  
        const nextState = {
          squares: nextSquares,
          turnOff: player==="X" ? 'O' : 'X',
        };
  
        setSquares(nextState.squares);
        // setIsYourTurn(isYourTurn => !isYourTurn);     
        setIsYourTurn(false);     
        // console.log('to server', nextState.squares);      
        // console.log('to server=> ', ' turnOff',nextState.turnOff );
        socket.emit("makeMove", { roomId, state: nextState });
      }
    };
  
    const XX = <span style={{ color: "#7cff17", fontSize:'1.1rem' }}>you</span>
    const OO = <span style={{ color: "#ff5d17", fontSize:'1.1rem' }}>opponent</span>
    const winnerComp = (
      <span>
        {winner ? (
          <span style={{ color: "#ffd817" }}>
            Winner:{" "}
            {player === winner ? XX : OO}
          </span>
        ) : (
          <span style={{ color: "#e89714" }}>
            Turn:{" "}
            {isYourTurn ? XX : OO}
          </span>
        )}
      </span>
    );
    const scoresComp = (
      <span>
          Score : {' '}
          <span style={{ color: "#5dff17" }}>
            {scores[playerName] ? scores[playerName] : '0'}
          </span>
            {' | '}
          <span style={{ color: "#e81469" }}>
          {scores[opponetPlayerName] ? scores[opponetPlayerName] : '0'}
          </span>
        
      </span>
    );

    
    const handleReset = () => {
      setIsDisabled(true);
      const resetState = {
        squares: Array(9).fill(null),
        turnOff: 'both',
      };
      winnerAnnounced.current = false; // Reset the ref
      
      let winnerName ='';
      if (winner) {
         winnerName = (player === winner ) ? playerName : opponetPlayerName;
      }
      socket.emit("resetGame", { roomId, state: resetState, winnerName });
      // Re-enable the button after 3 seconds
        setTimeout(() => {
          setIsDisabled(false);
        }, 3000);
    };

    return (
      <div>      
        <h1 className="heading">Tic Tac Toe</h1>
        <div className="status-message">{scoresComp}</div>
        <div className="status-message mb-4">Opponent : <span style={{ fontSize:'1.2rem', color: "#ff705d", fontWeight: '600' }}> {opponetPlayerName ? opponetPlayerName : 'Not Joined'} </span> </div>
        <div style={{ fontSize: '1.3rem' }} className="status-message">{winnerComp}</div>
        <div className="grid-layout">
          {squares.map((square, index) => (
            <Square key={index} value={square} onClick={() => handleClick(index)} />
          ))}
        </div>
        {winner && (
          <button
            className="btn btn2"
            onClick={() => {  handleReset()  }}
            disabled={isDisabled}
          >
            Restart Game
          </button>
        )}
      </div>
    );
  };
  
  
  
  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
  
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {      
        // console.log('winner ', squares[a]);
        return squares[a];      
      }
    }
    return null;
  };
  




  export default Board;