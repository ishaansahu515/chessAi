import React from 'react';
import { Crown, AlertCircle, Clock } from 'lucide-react';
import { GameState, PieceColor } from '../types/chess';
import { ChessPiece } from './ChessPiece';

interface GameStatusProps {
  gameState: GameState;
  isAIThinking: boolean;
}

export function GameStatus({ gameState, isAIThinking }: GameStatusProps) {
  const getCurrentPlayer = () => {
    return gameState.turn === 'w' ? 'White' : 'Black';
  };

  const getGameStatusMessage = () => {
    if (gameState.isGameOver) {
      if (gameState.winner === 'draw') {
        return 'Game ended in a draw!';
      } else if (gameState.winner) {
        const winnerName = gameState.winner === 'w' ? 'White' : 'Black';
        return `${winnerName} wins!`;
      }
    }
    
    if (isAIThinking) {
      return 'AI is thinking...';
    }
    
    if (gameState.turn === 'b') {
      return "Black's turn";
    }
    
    return `${getCurrentPlayer()}'s turn`;
  };

  const sortPieces = (pieces: any[]) => {
    const order = { 'q': 0, 'r': 1, 'b': 2, 'n': 3, 'p': 4 };
    return [...pieces].sort((a, b) => (order[a.type] || 5) - (order[b.type] || 5));
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg">
      <div className="text-center mb-4">
        <div className={`text-lg font-bold flex items-center justify-center gap-2 ${
          gameState.isGameOver 
            ? gameState.winner === 'draw' 
              ? 'text-yellow-600' 
              : 'text-green-600'
            : isAIThinking
              ? 'text-blue-600'
              : gameState.turn === 'w' 
                ? 'text-amber-600' 
                : 'text-gray-800'
        }`}>
          {gameState.isGameOver && gameState.winner !== 'draw' && (
            <Crown className="w-5 h-5" />
          )}
          {isAIThinking && (
            <Clock className="w-5 h-5 animate-spin" />
          )}
          {!gameState.isGameOver && !isAIThinking && (
            <AlertCircle className="w-5 h-5" />
          )}
          {getGameStatusMessage()}
        </div>
      </div>

      <div className="space-y-4">
        {/* Captured Pieces */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Captured Pieces</h4>
          
          <div className="mb-2">
            <div className="text-sm text-gray-600 mb-1">White captured:</div>
            <div className="flex flex-wrap gap-1 min-h-[2rem] bg-gray-50 p-2 rounded">
              {sortPieces(gameState.capturedPieces.white).map((piece, index) => (
                <div key={index} className="text-lg">
                  <ChessPiece piece={piece} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Black captured:</div>
            <div className="flex flex-wrap gap-1 min-h-[2rem] bg-gray-50 p-2 rounded">
              {sortPieces(gameState.capturedPieces.black).map((piece, index) => (
                <div key={index} className="text-lg">
                  <ChessPiece piece={piece} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Move History */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Move History</h4>
          <div className="bg-gray-50 p-2 rounded max-h-32 overflow-y-auto text-sm">
            {gameState.moveHistory.length === 0 ? (
              <div className="text-gray-500 italic">No moves yet</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gameState.moveHistory.map((move, index) => (
                  <div key={index} className="text-gray-700">
                    {Math.floor(index / 2) + 1}. {move}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}