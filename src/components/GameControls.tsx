import React from 'react';
import { RotateCcw, Settings, Play, Brain, Users } from 'lucide-react';
import { GameMode, AIDifficulty } from '../types/chess';
import { useOnlineGame } from '../hooks/useOnlineGame';

interface GameControlsProps {
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  aiDifficulty: AIDifficulty;
  setAIDifficulty: (difficulty: AIDifficulty) => void;
  onlineGame: ReturnType<typeof useOnlineGame>;
  onReset: () => void;
  isAIThinking: boolean;
}

export function GameControls({
  gameMode,
  setGameMode,
  aiDifficulty,
  setAIDifficulty,
  onlineGame,
  onReset,
  isAIThinking
}: GameControlsProps) {
  const handleModeChange = (mode: GameMode) => {
    if (mode !== 'online-multiplayer' && onlineGame.onlineState.gameId) {
      onlineGame.leaveGame();
    }
    setGameMode(mode);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Game Settings
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Game Mode
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
            <button
                onClick={() => handleModeChange('human-vs-human')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                gameMode === 'human-vs-human'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Play className="w-4 h-4 inline mr-1" />
              Human vs Human
            </button>
            <button
                onClick={() => handleModeChange('human-vs-ai')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                gameMode === 'human-vs-ai'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Brain className="w-4 h-4 inline mr-1" />
              Human vs AI
            </button>
          </div>
            <button
              onClick={() => handleModeChange('online-multiplayer')}
              className={`w-full py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                gameMode === 'online-multiplayer'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              Online Multiplayer
            </button>
          </div>
        </div>

        {gameMode === 'human-vs-ai' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Difficulty
            </label>
            <select
              value={aiDifficulty}
              onChange={(e) => setAIDifficulty(e.target.value as AIDifficulty)}
              className="w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isAIThinking}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        )}

        <button
          onClick={onReset}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
          disabled={isAIThinking || (gameMode === 'online-multiplayer' && !onlineGame.onlineState.opponentConnected)}
        >
          <RotateCcw className="w-4 h-4" />
          Reset Game
        </button>

        {isAIThinking && (
          <div className="text-center text-blue-600 font-medium animate-pulse">
            <Brain className="w-4 h-4 inline mr-1 animate-pulse" />
            AI is thinking...
          </div>
        )}
      </div>
    </div>
  );
}