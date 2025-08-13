import { useState, useCallback, useEffect } from 'react';
import { GameState, GameMode, AIDifficulty, PieceColor, GameMessage } from '../types/chess';
import { ChessGame } from '../utils/chessLogic';
import { StockfishAI } from '../utils/stockfishAI';
import { useOnlineGame } from './useOnlineGame';
import { socketService } from '../utils/socketService';

export function useChessGame() {
  const [chessGame] = useState(() => new ChessGame());
  const [stockfishAI] = useState(() => new StockfishAI());
  const [gameMode, setGameMode] = useState<GameMode>('human-vs-human');
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>('medium');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const onlineGame = useOnlineGame();

  const [gameState, setGameState] = useState<GameState>(() => ({
    board: chessGame.getBoard(),
    turn: chessGame.getTurn(),
    isGameOver: chessGame.isGameOver(),
    winner: null,
    selectedSquare: null,
    possibleMoves: [],
    moveHistory: chessGame.getMoveHistory(),
    capturedPieces: chessGame.getCapturedPieces(),
    lastMove: chessGame.getLastMove()
  }));

  const updateGameState = useCallback(() => {
    const newState: GameState = {
      board: chessGame.getBoard(),
      turn: chessGame.getTurn(),
      isGameOver: chessGame.isGameOver(),
      winner: chessGame.getGameResult() === 'checkmate' 
        ? (chessGame.getTurn() === 'w' ? 'b' : 'w')
        : chessGame.getGameResult() === 'draw' ? 'draw' : null,
      selectedSquare: gameState.selectedSquare,
      possibleMoves: gameState.possibleMoves,
      moveHistory: chessGame.getMoveHistory(),
      capturedPieces: chessGame.getCapturedPieces(),
      lastMove: chessGame.getLastMove()
    };
    setGameState(newState);
  }, [chessGame, gameState.selectedSquare, gameState.possibleMoves]);

  const selectSquare = useCallback((row: number, col: number) => {
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
      const possibleMoves = chessGame.getPossibleMoves(row, col);
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
        const possibleMoves = chessGame.getPossibleMoves(row, col);
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
  }, [gameState, chessGame]);

  const makeMove = useCallback((from: [number, number], to: [number, number]) => {
    const success = chessGame.makeMove(from, to);
    
    if (success) {
      // Send move to online opponent if in online mode
      if (gameMode === 'online-multiplayer' && onlineGame.onlineState.isConnected) {
        onlineGame.sendMove(from, to);
      }
      
      setGameState(prev => ({
        ...prev,
        selectedSquare: null,
        possibleMoves: []
      }));
      updateGameState();
    }
  }, [chessGame, updateGameState, gameMode, onlineGame]);

  const makeAIMove = useCallback(async () => {
    if (gameMode !== 'human-vs-ai' || gameState.turn !== 'b' || isAIThinking || gameState.isGameOver) {
      console.log('AI move conditions not met:', {
        gameMode,
        turn: gameState.turn,
        isAIThinking,
        isGameOver: gameState.isGameOver
      });
      return;
    }

    console.log('Starting AI move...');
    setIsAIThinking(true);
    
    try {
      const fen = chessGame.getFEN();
      console.log('Current FEN:', fen);
      const aiMove = await stockfishAI.getBestMove(fen, aiDifficulty);
      
      console.log('AI selected move:', aiMove);
      
      if (aiMove) {
        // Use from/to notation to make the move
        const success = chessGame.makeMoveFromTo(aiMove.from, aiMove.to, aiMove.promotion);
        
        if (success) {
          console.log('AI move successful:', aiMove);
          setGameState(prev => ({
            ...prev,
            selectedSquare: null,
            possibleMoves: []
          }));
          updateGameState();
        } else {
          console.error('AI move failed:', aiMove);
        }
      } else {
        console.log('AI could not find a valid move');
      }
    } catch (error) {
      console.error('AI move failed:', error);
    } finally {
      setIsAIThinking(false);
    }
  }, [gameMode, gameState.turn, gameState.isGameOver, isAIThinking, chessGame, stockfishAI, aiDifficulty, updateGameState]);

  const resetGame = useCallback(() => {
    chessGame.reset();
    
    // Send reset to online opponent if in online mode
    if (gameMode === 'online-multiplayer' && onlineGame.onlineState.isConnected) {
      onlineGame.sendReset();
    }
    
    setGameState({
      board: chessGame.getBoard(),
      turn: chessGame.getTurn(),
      isGameOver: false,
      winner: null,
      selectedSquare: null,
      possibleMoves: [],
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      lastMove: null
    });
    setIsAIThinking(false);
  }, [chessGame, gameMode, onlineGame]);

  // Handle online game messages
  useEffect(() => {
    if (gameMode === 'online-multiplayer' && onlineGame.onlineState.isConnected) {
      const handleGameMessage = (message: GameMessage) => {
        switch (message.type) {
          case 'move':
            const { from, to } = message.data;
            const success = chessGame.makeMove(from, to);
            if (success) {
              setGameState(prev => ({
                ...prev,
                selectedSquare: null,
                possibleMoves: []
              }));
              updateGameState();
            }
            break;
          case 'reset':
            chessGame.reset();
            setGameState({
              board: chessGame.getBoard(),
              turn: chessGame.getTurn(),
              isGameOver: false,
              winner: null,
              selectedSquare: null,
              possibleMoves: [],
              moveHistory: [],
              capturedPieces: { white: [], black: [] },
              lastMove: null
            });
            break;
        }
      };

      socketService.onGameMessage(handleGameMessage);
    }
  }, [gameMode, onlineGame.onlineState.isConnected, chessGame, updateGameState]);

  // Prevent moves when it's not player's turn in online mode
  const canMakeMove = useCallback((pieceColor: PieceColor) => {
    if (gameMode === 'online-multiplayer') {
      return onlineGame.onlineState.playerColor === pieceColor && 
             onlineGame.onlineState.opponentConnected;
    }
    return true;
  }, [gameMode, onlineGame.onlineState]);

  // Auto-make AI move when it's AI's turn
  useEffect(() => {
    console.log('Effect triggered:', {
      gameMode,
      turn: gameState.turn,
      isGameOver: gameState.isGameOver,
      isAIThinking
    });
    
    if (gameMode === 'human-vs-ai' && 
        gameState.turn === 'b' && 
        !gameState.isGameOver && 
        !isAIThinking) {
      console.log('Setting timer for AI move...');
      const timer = setTimeout(() => {
        console.log('Timer fired, making AI move...');
        makeAIMove();
      }, 500); // Small delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [gameMode, gameState.turn, gameState.isGameOver, isAIThinking, makeAIMove]);

  // Cleanup AI on unmount
  useEffect(() => {
    return () => {
      stockfishAI.destroy();
    };
  }, [stockfishAI]);

  return {
    gameState,
    gameMode,
    setGameMode,
    aiDifficulty,
    setAIDifficulty,
    isAIThinking,
    onlineGame,
    canMakeMove,
    selectSquare,
    makeMove,
    resetGame
  };
}