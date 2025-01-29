// socketUtils.js
import { toast } from 'react-hot-toast';

// Toast configuration
export const toastConfig = {
  success: {
    duration: 3000,
    style: {
      background: '#4CAF50',
      color: 'white',
    },
  },
  error: {
    duration: 4000,
    style: {
      background: '#f44336',
      color: 'white',
    },
  },
  info: {
    duration: 3000,
    style: {
      background: '#2196F3',
      color: 'white',
    },
  },
};

// Socket event handlers
export const socketEvents = {
  onConnect: (setIsConnected) => {
    setIsConnected(true);
    toast.success('Connected to game server', {
      icon: '🎮',
      ...toastConfig.success,
    });
  },

  onDisconnect: (setIsConnected) => {
    setIsConnected(false);
    toast.error('Lost connection to game server', {
      icon: '❌',
      ...toastConfig.error,
    });
  },

  onConnectError: (setIsConnected) => {
    setIsConnected(false);
    toast.error('Unable to connect to game server', {
      icon: '🔌',
      ...toastConfig.error,
    });
  },

  onPlayerLeft: (playerName) => {
    if (playerName) {
      toast(`${playerName} left the game`, {
        icon: '🛑',
        ...toastConfig.info,
      });
    }
  },

  onPlayerJoined: (playerName) => {
    if (playerName) {
      toast(`${playerName} joined the game`, {
        icon: '👋',
        ...toastConfig.success,
      });
    }
  },
};

// Game state handlers
export const gameStateHandlers = {
  handleReset: (callback, setIsDisabled) => {
    setIsDisabled(true);
    callback();
    setTimeout(() => {
      setIsDisabled(false);
    }, 3000);
  },

  handleGameEnd: (winner, players) => {
    toast(`Game Over! ${winner === 'draw' ? "It's a draw!" : `${players[winner]} wins!`}`, {
      icon: winner === 'draw' ? '🤝' : '🏆',
      ...toastConfig.success,
    });
  },
};

// Room management functions
export const roomHandlers = {
  copyRoomId: (roomId) => {
    navigator.clipboard.writeText(roomId);
    toast.success('Room ID copied to clipboard!', {
      icon: '📋',
      ...toastConfig.success,
    });
  },

  handleRoomError: (error) => {
    toast.error(error, {
      icon: '⚠️',
      ...toastConfig.error,
    });
  },
};


// Helper functions
export const helpers = {

  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};