import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Bot, Crown, Loader } from 'lucide-react';
import { gameService } from '../services/gameService';

export function MainMenu() {
  const navigate = useNavigate();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayOffline = () => {
    navigate('/offline');
  };

  const handleCreateOnlineGame = async () => {
    setIsCreatingGame(true);
    setError(null);
    
    try {
      const { gameId } = await gameService.createGame();
      navigate(`/game/${gameId}`, { 
        state: { isCreator: true } 
      });
    } catch (error) {
      console.error('Failed to create game:', error);
      setError('Failed to create online game. Please try again.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <Crown className="w-16 h-16 text-amber-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Chess Master
          </h1>
          <p className="text-gray-600">
            Choose your game mode
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleCreateOnlineGame}
            disabled={isCreatingGame}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg font-medium"
          >
            {isCreatingGame ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                Creating Game...
              </>
            ) : (
              <>
                <Users className="w-6 h-6" />
                Play Online
              </>
            )}
          </button>

          <button
            onClick={handlePlayOffline}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg font-medium"
          >
            <Bot className="w-6 h-6" />
            Play vs AI
          </button>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Online games support real-time multiplayer with shareable links
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>Features:</p>
            <ul className="mt-2 space-y-1">
              <li>• Real-time multiplayer</li>
              <li>• Sound effects</li>
              <li>• Drag & drop pieces</li>
              <li>• Full chess rules</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}