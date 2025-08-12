import { useState, useCallback, useEffect } from 'react';
import { GameState, GameMode, AIDifficulty, PieceColor } from '../types/chess';
import { ChessGame } from '../utils/chessLogic';
import { StockfishAI } from '../utils/stockfishAI';

export function useChessGame() {
  const [chessGame] = useState(() => new ChessGame());
  const [stockfishAI] = useState(() => new StockfishAI());
  const [gameMode, setGameMode] = useState<GameMode>('human-vs-human');
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>('medium');
  const [isAIThinking, setIsAIThinking] = useState(false);

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
      setGameState(prev => ({
        ...prev,
        selectedSquare: null,
        possibleMoves: []
      }));
      updateGameState();
    }
  }, [chessGame, updateGameState]);

  const makeAIMove = useCallback(async () => {
    if (gameMode !== 'human-vs-ai' || gameState.turn !== 'b' || isAIThinking || gameState.isGameOver) {
      return;
    }

    setIsAIThinking(true);
    
    try {
      const fen = chessGame.getFEN();
      const aiMove = await stockfishAI.getBestMove(fen, aiDifficulty);
      
      if (aiMove && aiMove !== '(none)' && aiMove !== '') {
        // Parse UCI move format (e.g., "e2e4")
        const from = aiMove.slice(0, 2);
        const to = aiMove.slice(2, 4);
        
        const fromCoords: [number, number] = [
          '87654321'.indexOf(from[1]),
          'abcdefgh'.indexOf(from[0])
        ];
        const toCoords: [number, number] = [
          '87654321'.indexOf(to[1]),
          'abcdefgh'.indexOf(to[0])
        ];
        
        makeMove(fromCoords, toCoords);
      } else {
        console.log('AI could not find a valid move');
      }
    } catch (error) {
      console.error('AI move failed:', error);
    } finally {
      setIsAIThinking(false);
    }
  }, [gameMode, gameState.turn, isAIThinking, chessGame, stockfishAI, aiDifficulty, makeMove]);

  const resetGame = useCallback(() => {
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
  }, [chessGame]);

  // Auto-make AI move when it's AI's turn
  useEffect(() => {
    if (gameMode === 'human-vs-ai' && 
        gameState.turn === 'b' && 
        !gameState.isGameOver && 
        !isAIThinking) {
      const timer = setTimeout(() => {
        makeAIMove();
      }, 800); // Small delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [gameMode, gameState.turn, gameState.isGameOver, isAIThinking, makeAIMove, gameState.board]);

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
    selectSquare,
    makeMove,
    resetGame
  };
}