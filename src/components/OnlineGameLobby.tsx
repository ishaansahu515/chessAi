import React, { useState } from 'react';
import { Copy, Users, Wifi, WifiOff } from 'lucide-react';
import { OnlineGameState } from '../types/chess';

interface OnlineGameLobbyProps {
  gameState: OnlineGameState;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  isJoined: boolean;
  onJoinGame: (playerName: string) => void;
  shareUrl?: string;
}

export function OnlineGameLobby({ 
  gameState, 
  connectionStatus, 
  isJoined, 
  onJoinGame,
  shareUrl 
}: OnlineGameLobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [copied, setCopied] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onJoinGame(playerName.trim());
    }
  };

  const copyShareUrl = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-5 h-5 text-green-500" />;
      case 'connecting':
        return <Wifi className="w-5 h-5 text-yellow-500 animate-pulse" />;
      case 'disconnected':
        return <WifiOff className="w-5 h-5 text-red-500" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Join Chess Game
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm">
              {getConnectionIcon()}
              <span className={`
                ${connectionStatus === 'connected' ? 'text-green-600' : 
                  connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'}
              `}>
                {getConnectionText()}
              </span>
            </div>
          </div>

          {shareUrl && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share this link with your friend:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                />
                <button
                  onClick={copyShareUrl}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {copied ? '✓' : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={connectionStatus !== 'connected'}
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={connectionStatus !== 'connected' || !playerName.trim()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Join Game
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Show waiting for players
  if (gameState.players.length < 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Waiting for Opponent
          </h2>
          <p className="text-gray-600 mb-6">
            Share the game link with a friend to start playing!
          </p>
          
          {shareUrl && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                />
                <button
                  onClick={copyShareUrl}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  {copied ? '✓' : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <div className="text-sm text-gray-500">
              Players: {gameState.players.length}/2
            </div>
            <div className="mt-2">
              {gameState.players.map((player, index) => (
                <div key={player.id} className="flex items-center justify-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    player.connected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-gray-700">
                    {player.name} ({player.color})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}