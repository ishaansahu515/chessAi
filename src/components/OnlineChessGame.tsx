import React from 'react';
import { ChessBoard } from './ChessBoard';
import { GameStatus } from './GameStatus';
import { OnlineGameLobby } from './OnlineGameLobby';
import { useOnlineChess } from '../hooks/useOnlineChess';
import { AlertCircle } from 'lucide-react';

interface OnlineChessGameProps {
  shareUrl?: string;
}

export function OnlineChessGame({ shareUrl }: OnlineChessGameProps) {
  const {
    gameState,
    connectionStatus,
    isJoined,
    error,
    joinGame,
    selectSquare,
    makeMove,
    setError
  } = useOnlineChess();

  // Show lobby if not joined or waiting for players
  if (!isJoined || gameState.players.length < 2) {
    return (
      <OnlineGameLobby
        gameState={gameState}
        connectionStatus={connectionStatus}
        isJoined={isJoined}
        onJoinGame={joinGame}
        shareUrl={shareUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Online Chess
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <span>You are playing as {gameState.myColor}</span>
            <span>•</span>
            <span>Game ID: {gameState.gameId}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-8 items-start justify-center">
          {/* Players Info */}
          <div className="xl:order-1 w-full xl:w-80">
            <div className="bg-white rounded-lg p-4 shadow-lg mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Players</h3>
              <div className="space-y-2">
                {gameState.players.map((player) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded ${
                      player.color === gameState.myColor ? 'bg-blue-100' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        player.connected ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{player.name}</span>
                      {player.color === gameState.myColor && (
                        <span className="text-xs text-blue-600">(You)</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 capitalize">
                      {player.color}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Turn Indicator */}
            <div className="bg-white rounded-lg p-4 shadow-lg">
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  gameState.canMove ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {gameState.canMove ? "Your Turn" : "Opponent's Turn"}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {gameState.turn === 'w' ? 'White' : 'Black'} to move
                </div>
              </div>
            </div>
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
              isAIThinking={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Playing online chess • Moves sync in real-time</p>
        </div>
      </div>
    </div>
  );
}