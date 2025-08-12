const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // Replace with your actual domain
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO configuration
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Game state storage (in production, use Redis or database)
const games = new Map();
const playerSockets = new Map();

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// API Routes
app.post('/api/create-game', (req, res) => {
  const gameId = uuidv4();
  const game = {
    id: gameId,
    players: [],
    gameState: {
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      turn: 'w',
      moveHistory: [],
      isGameOver: false,
      winner: null
    },
    createdAt: new Date()
  };
  
  games.set(gameId, game);
  
  res.json({ 
    gameId, 
    shareUrl: `${req.protocol}://${req.get('host')}/game/${gameId}` 
  });
});

app.get('/api/game/:id', (req, res) => {
  const game = games.get(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json(game);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-game', ({ gameId, playerName }) => {
    const game = games.get(gameId);
    
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    // Check if player already exists or add new player
    let player = game.players.find(p => p.socketId === socket.id);
    
    if (!player && game.players.length < 2) {
      const playerColor = game.players.length === 0 ? 'white' : 'black';
      player = {
        id: socket.id,
        socketId: socket.id,
        name: playerName || `Player ${game.players.length + 1}`,
        color: playerColor,
        connected: true
      };
      game.players.push(player);
    } else if (player) {
      player.connected = true;
      player.socketId = socket.id;
    }

    if (!player) {
      socket.emit('error', { message: 'Game is full' });
      return;
    }

    // Store player-socket mapping
    playerSockets.set(socket.id, { gameId, playerId: player.id });
    
    // Join socket room
    socket.join(gameId);
    
    // Send game state to joining player
    socket.emit('game-joined', {
      game,
      player,
      canStart: game.players.length === 2
    });
    
    // Notify other players
    socket.to(gameId).emit('player-joined', {
      player,
      playersCount: game.players.length,
      canStart: game.players.length === 2
    });

    console.log(`Player ${player.name} (${player.color}) joined game ${gameId}`);
  });

  socket.on('make-move', ({ gameId, move, newFen, moveHistory }) => {
    const game = games.get(gameId);
    const playerInfo = playerSockets.get(socket.id);
    
    if (!game || !playerInfo) {
      socket.emit('error', { message: 'Invalid game or player' });
      return;
    }

    const player = game.players.find(p => p.socketId === socket.id);
    if (!player) {
      socket.emit('error', { message: 'Player not found in game' });
      return;
    }

    // Update game state
    game.gameState.fen = newFen;
    game.gameState.turn = game.gameState.turn === 'w' ? 'b' : 'w';
    game.gameState.moveHistory = moveHistory;

    // Broadcast move to all players in the game
    io.to(gameId).emit('move-made', {
      move,
      newFen,
      moveHistory,
      turn: game.gameState.turn,
      playerName: player.name,
      playerColor: player.color
    });

    console.log(`Move made in game ${gameId}:`, move);
  });

  socket.on('game-over', ({ gameId, winner, reason }) => {
    const game = games.get(gameId);
    if (!game) return;

    game.gameState.isGameOver = true;
    game.gameState.winner = winner;

    io.to(gameId).emit('game-ended', {
      winner,
      reason,
      gameState: game.gameState
    });

    console.log(`Game ${gameId} ended. Winner: ${winner}, Reason: ${reason}`);
  });

  socket.on('disconnect', () => {
    const playerInfo = playerSockets.get(socket.id);
    
    if (playerInfo) {
      const { gameId } = playerInfo;
      const game = games.get(gameId);
      
      if (game) {
        const player = game.players.find(p => p.socketId === socket.id);
        if (player) {
          player.connected = false;
          
          // Notify other players
          socket.to(gameId).emit('player-disconnected', {
            playerName: player.name,
            playerColor: player.color
          });
        }
      }
      
      playerSockets.delete(socket.id);
    }
    
    console.log('User disconnected:', socket.id);
  });
});

// Cleanup old games (run every hour)
setInterval(() => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  for (const [gameId, game] of games.entries()) {
    if (game.createdAt < oneHourAgo) {
      games.delete(gameId);
      console.log(`Cleaned up old game: ${gameId}`);
    }
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});