import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// ✅ Local-friendly CORS (allow dev frontends)
const corsOptions = {
  origin: [
    'http://localhost:5173', // Vite
    'http://localhost:3000', // CRA
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    methods: ['GET', 'POST'],
  }
});

// Store games and player connections
const games = new Map();
const playerSockets = new Map();

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// API: Create a game
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

// API: Get game state
app.get('/api/game/:id', (req, res) => {
  const game = games.get(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game);
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-game', ({ gameId, playerName }) => {
    const game = games.get(gameId);
    if (!game) {
      socket.emit('error', { message: 'Game not found' });
      return;
    }

    let player = game.players.find((p) => p.socketId === socket.id);
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

    playerSockets.set(socket.id, { gameId, playerId: player.id });
    socket.join(gameId);

    socket.emit('game-joined', {
      game,
      player,
      canStart: game.players.length === 2
    });

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

    const player = game.players.find((p) => p.socketId === socket.id);
    if (!player) {
      socket.emit('error', { message: 'Player not found in game' });
      return;
    }

    game.gameState.fen = newFen;
    game.gameState.turn = game.gameState.turn === 'w' ? 'b' : 'w';
    game.gameState.moveHistory = moveHistory;

    io.to(gameId).emit('move-made', {
      move,
      newFen,
      moveHistory,
      turn: game.gameState.turn,
      playerName: player.name,
      playerColor: player.color
    });

    console.log(`Move in game ${gameId}:`, move);
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
        const player = game.players.find((p) => p.socketId === socket.id);
        if (player) {
          player.connected = false;
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

// Cleanup old games
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [gameId, game] of games.entries()) {
    if (game.createdAt.getTime() < oneHourAgo) {
      games.delete(gameId);
      console.log(`Cleaned old game: ${gameId}`);
    }
  }
}, 60 * 60 * 1000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
