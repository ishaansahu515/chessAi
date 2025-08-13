import React from 'react';
import { ChessBoard } from './components/ChessBoard';
import { GameControls } from './components/GameControls';
import { OnlineControls } from './components/OnlineControls';
import { GameStatus } from './components/GameStatus';
import { useChessGame } from './hooks/useChessGame';

function App() {
  const {
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
  } = useChessGame();

  const handleSquareClick = (row: number, col: number) => {
    const piece = gameState.board[row][col];
    if (piece && !canMakeMove(piece.color)) {
      return; // Prevent moves when it's not player's turn in online mode
    }
    selectSquare(row, col);
  };

  const handleMove = (from: [number, number], to: [number, number]) => {
    const piece = gameState.board[from[0]][from[1]];
    if (piece && !canMakeMove(piece.color)) {
      return; // Prevent moves when it's not player's turn in online mode
    }
    makeMove(from, to);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Chess Master
          </h1>
          <p className="text-gray-600">
            Play against friends or challenge our AI opponent
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start justify-center">
          {/* Game Controls */}
          <div className="xl:order-1 w-full xl:w-80 space-y-4">
            <GameControls
              gameMode={gameMode}
              setGameMode={setGameMode}
              aiDifficulty={aiDifficulty}
              setAIDifficulty={setAIDifficulty}
              onlineGame={onlineGame}
              onReset={resetGame}
              isAIThinking={isAIThinking}
            />
            
            {gameMode === 'online-multiplayer' && (
              <OnlineControls onlineGame={onlineGame} />
            )}
          </div>

          {/* Chess Board */}
          <div className="xl:order-2 flex justify-center">
            <div className="w-full max-w-2xl">
              <ChessBoard
                gameState={gameState}
                onSquareClick={handleSquareClick}
                onMove={handleMove}
              />
            </div>
          </div>

          {/* Game Status */}
          <div className="xl:order-3 w-full xl:w-80">
            <GameStatus
              gameState={gameState}
              isAIThinking={isAIThinking}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Drag and drop pieces or click to select and move</p>
          <p>Play with friends online or challenge the AI</p>
        </div>
      </div>
    </div>
  );
}

export default App;