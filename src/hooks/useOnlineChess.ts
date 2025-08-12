import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { OnlineGameState, OnlinePlayer } from '../types/chess';
import { socketService } from '../services/socketService';
import { gameService } from '../services/gameService';
import { soundService } from '../services/soundService';

export function useOnlineChess() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  
  const [chess] = useState(() => new Chess());
  const [gameState, setGameState] = useState<OnlineGameState>({
    board: chess.board(),
    turn: 'w',
    isGameOver: false,
    winner: null,
    selectedSquare: null,
    possibleMoves: [],
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    lastMove: null,
    gameId,
    players: [],
    isOnline: true,
    myColor: undefined,
    canMove: false
  });
  
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [playerName, setPlayerName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Convert chess.js board to our format
  const convertBoard = useCallback(() => {
    const board = [];
    const chessBoard = chess.board();
    
    for (let row = 0; row < 8; row++) {
      board[row] = [];
      for (let col = 0; col < 8; col++) {
        const piece = chessBoard[row][col];
        board[row][col] = piece ? {
          type: piece.type,
          color: piece.color
        } : null;
      }
    }
    
    return board;
  }, [chess]);

  // Get captured pieces
  const getCapturedPieces = useCallback(() => {
    const captured = { white: [], black: [] };
    const history = chess.history({ verbose: true });
    
    for (const move of history) {
      if (move.captured) {
        const capturedPiece = {
          type: move.captured,
          color: move.color === 'w' ? 'b' : 'w'
        };
        if (capturedPiece.color === 'w') {
          captured.white.push(capturedPiece);
        } else {
          captured.black.push(capturedPiece);
        }
      }
    }
    
    return captured;
  }, [chess]);

  // Get last move coordinates
  const getLastMove = useCallback(() => {
    const history = chess.history({ verbose: true });
    if (history.length === 0) return null;
    
    const lastMove = history[history.length - 1];
    const files = 'abcdefgh';
    const ranks = '87654321';
    
    const fromCol = files.indexOf(lastMove.from[0]);
    const fromRow = ranks.indexOf(lastMove.from[1]);
    const toCol = files.indexOf(lastMove.to[0]);
    const toRow = ranks.indexOf(lastMove.to[1]);
    
    return [[fromRow, fromCol], [toRow, toCol]];
  }, [chess]);

  // Update game state from chess instance
  const updateGameState = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: convertBoard(),
      turn: chess.turn(),
      isGameOver: chess.isGameOver(),
      winner: chess.isCheckmate() 
        ? (chess.turn() === 'w' ? 'b' : 'w')
        : chess.isDraw() ? 'draw' : null,
      moveHistory: chess.history(),
      capturedPieces: getCapturedPieces(),
      lastMove: getLastMove(),
      canMove: prev.myColor === chess.turn() && !chess.isGameOver()
    }));
  }, [chess, convertBoard, getCapturedPieces, getLastMove]);

  // Initialize connection
  useEffect(() => {
    if (!gameId) return;

    const initConnection = async () => {
      try {
        setConnectionStatus('connecting');
        await socketService.connect();
        setConnectionStatus('connected');
        
        // Verify game exists
        await gameService.getGame(gameId);
        
      } catch (error) {
        console.error('Connection failed:', error);
        setConnectionStatus('disconnected');
        setError('Failed to connect to game');
      }
    };

    initConnection();

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
    };
  }, [gameId]);

  // Set up socket event listeners
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    socketService.onGameJoined((data) => {
      console.log('Game joined:', data);
      const { game, player } = data;
      
      // Load game state
      chess.load(game.gameState.fen);
      
      setGameState(prev => ({
        ...prev,
        gameId: game.id,
        players: game.players,
        myColor: player.color,
        canMove: player.color === chess.turn() && !chess.isGameOver()
      }));
      
      updateGameState();
      setIsJoined(true);
    });

    socketService.onPlayerJoined((data) => {
      console.log('Player joined:', data);
      setGameState(prev => ({
        ...prev,
        players: [...prev.players.filter(p => p.id !== data.player.id), data.player]
      }));
    });

    socketService.onMoveMade((data) => {
      console.log('Move received:', data);
      const { move, newFen, playerColor } = data;
      
      // Load new position
      chess.load(newFen);
      updateGameState();
      
      // Play sound effect
      if (move.captured) {
        soundService.playCapture();
      } else {
        soundService.playMove();
      }
      
      // Play check sound if in check
      if (chess.inCheck()) {
        setTimeout(() => soundService.playCheck(), 100);
      }
      
      // Clear selection
      setGameState(prev => ({
        ...prev,
        selectedSquare: null,
        possibleMoves: []
      }));
    });

    socketService.onGameEnded((data) => {
      console.log('Game ended:', data);
      setGameState(prev => ({
        ...prev,
        isGameOver: true,
        winner: data.winner
      }));
    });

    socketService.onPlayerDisconnected((data) => {
      console.log('Player disconnected:', data);
      setGameState(prev => ({
        ...prev,
        players: prev.players.map(p => 
          p.name === data.playerName ? { ...p, connected: false } : p
        )
      }));
    });

    socketService.onError((data) => {
      console.error('Socket error:', data);
      setError(data.message);
    });

  }, [connectionStatus, chess, updateGameState]);

  // Join game
  const joinGame = useCallback((name: string) => {
    if (!gameId || !name.trim()) return;
    
    setPlayerName(name.trim());
    socketService.joinGame(gameId, name.trim());
  }, [gameId]);

  // Select square
  const selectSquare = useCallback((row: number, col: number) => {
    if (!gameState.canMove) return;
    
    const piece = gameState.board[row][col];
    
    // If clicking on selected square, deselect
    if (gameState.selectedSquare && 
        gameState.selectedSquare[0] === row && 
        gameState.selectedSquare[1] === col) {
      setGameState(prev => ({
        ...prev,
        selectedSquare: null,
        possibleMoves: []
      }));
      return;
    }

    // If no piece selected and clicking on own piece
    if (!gameState.selectedSquare && piece && piece.color === gameState.turn) {
      const square = String.fromCharCode(97 + col) + (8 - row);
      const moves = chess.moves({ square, verbose: true });
      const possibleMoves = moves.map(move => {
        const files = 'abcdefgh';
        const ranks = '87654321';
        const toCol = files.indexOf(move.to[0]);
        const toRow = ranks.indexOf(move.to[1]);
        return [toRow, toCol];
      });
      
      setGameState(prev => ({
        ...prev,
        selectedSquare: [row, col],
        possibleMoves
      }));
      return;
    }

    // If piece selected and clicking on possible move
    if (gameState.selectedSquare) {
      const isPossibleMove = gameState.possibleMoves.some(
        ([r, c]) => r === row && c === col
      );
      
      if (isPossibleMove) {
        makeMove(gameState.selectedSquare, [row, col]);
      } else if (piece && piece.color === gameState.turn) {
        // Select new piece
        const square = String.fromCharCode(97 + col) + (8 - row);
        const moves = chess.moves({ square, verbose: true });
        const possibleMoves = moves.map(move => {
          const files = 'abcdefgh';
          const ranks = '87654321';
          const toCol = files.indexOf(move.to[0]);
          const toRow = ranks.indexOf(move.to[1]);
          return [toRow, toCol];
        });
        
        setGameState(prev => ({
          ...prev,
          selectedSquare: [row, col],
          possibleMoves
        }));
      } else {
        // Deselect
        setGameState(prev => ({
          ...prev,
          selectedSquare: null,
          possibleMoves: []
        }));
      }
    }
  }, [gameState, chess]);

  // Make move
  const makeMove = useCallback((from: [number, number], to: [number, number]) => {
    if (!gameState.canMove) return;
    
    const files = 'abcdefgh';
    const ranks = '87654321';
    
    const fromSquare = files[from[1]] + ranks[from[0]];
    const toSquare = files[to[1]] + ranks[to[0]];
    
    try {
      const move = chess.move({
        from: fromSquare,
        to: toSquare,
        promotion: 'q' // Auto-promote to queen
      });
      
      if (move) {
        // Send move to server
        socketService.makeMove(move, chess.fen(), chess.history());
        
        // Check for game over
        if (chess.isGameOver()) {
          const winner = chess.isCheckmate() 
            ? (chess.turn() === 'w' ? 'black' : 'white')
            : null;
          const reason = chess.isCheckmate() ? 'checkmate' : 
                        chess.isStalemate() ? 'stalemate' : 'draw';
          
          socketService.gameOver(winner, reason);
        }
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
  }, [gameState.canMove, chess]);

  // Handle drag and drop
  const handleDrop = useCallback((from: [number, number], to: [number, number]) => {
    makeMove(from, to);
  }, [makeMove]);

  return {
    gameState,
    connectionStatus,
    isJoined,
    error,
    joinGame,
    selectSquare,
    makeMove: handleDrop,
    setError
  };
}