import React from 'react';
import { ChessBoard } from './components/ChessBoard';
import { GameControls } from './components/GameControls';
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
    selectSquare,
    makeMove,
    resetGame
  } = useChessGame();

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
          <div className="xl:order-1 w-full xl:w-80">
            <GameControls
              gameMode={gameMode}
              setGameMode={setGameMode}
              aiDifficulty={aiDifficulty}
              setAIDifficulty={setAIDifficulty}
              onReset={resetGame}
              isAIThinking={isAIThinking}
            />
          </div>

          {/* Chess Board */}
          <div className="xl:order-2 flex justify-center">
            <div className="w-full max-w-2xl">
              <ChessBoard
                gameState={gameState}
                onSquareClick={selectSquare}
                onMove={makeMove}
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
          <p>Powered by Stockfish AI Engine</p>
        </div>
      </div>
    </div>
  );
}

export default App;