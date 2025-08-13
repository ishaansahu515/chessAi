import React, { useState } from 'react';
import { Share2, Users, Copy, Check, Wifi, WifiOff, Link } from 'lucide-react';
import { useOnlineGame } from '../hooks/useOnlineGame';

interface OnlineControlsProps {
  onlineGame: ReturnType<typeof useOnlineGame>;
}

export function OnlineControls({ onlineGame }: OnlineControlsProps) {
  const [gameIdInput, setGameIdInput] = useState('');
  const [copied, setCopied] = useState(false);
  const { onlineState, connectionStatus, createGame, joinGame, leaveGame, getShareableLink } = onlineGame;

  const handleCreateGame = async () => {
    await createGame();
  };

  const handleJoinGame = async () => {
    if (gameIdInput.trim()) {
      await joinGame(gameIdInput.trim());
    }
  };

  const handleCopyLink = async () => {
    const link = getShareableLink();
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <WifiOff className="w-4 h-4 text-red-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        Online Multiplayer
      </h3>

      {/* Connection Status */}
      <div className="mb-4 p-2 bg-gray-50 rounded flex items-center gap-2">
        {getConnectionStatusIcon()}
        <span className="text-sm font-medium">{getConnectionStatusText()}</span>
      </div>

      {!onlineState.gameId ? (
        <div className="space-y-4">
          {/* Create Game */}
          <div>
            <button
              onClick={handleCreateGame}
              disabled={connectionStatus === 'connecting'}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Create New Game
            </button>
          </div>

          {/* Join Game */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Join Existing Game
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
                placeholder="Enter Game ID"
                className="flex-1 py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={8}
              />
              <button
                onClick={handleJoinGame}
                disabled={!gameIdInput.trim() || connectionStatus === 'connecting'}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-md transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Game Info */}
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="text-sm font-medium text-blue-800 mb-1">Game ID</div>
            <div className="text-lg font-bold text-blue-900">{onlineState.gameId}</div>
            <div className="text-sm text-blue-600 mt-1">
              You are playing as {onlineState.playerColor === 'w' ? 'White' : 'Black'}
              {onlineState.isHost && ' (Host)'}
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between text-sm">
            <span>Opponent:</span>
            <span className={`font-medium ${
              onlineState.opponentConnected ? 'text-green-600' : 'text-red-600'
            }`}>
              {onlineState.opponentConnected ? 'Connected' : 'Waiting...'}
            </span>
          </div>

          {/* Share Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share this link with your friend:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={getShareableLink()}
                readOnly
                className="flex-1 py-2 px-3 border border-gray-300 rounded-md bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-3 rounded-md transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Leave Game */}
          <button
            onClick={leaveGame}
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md transition-colors"
          >
            Leave Game
          </button>
        </div>
      )}

      {!onlineState.opponentConnected && onlineState.gameId && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center gap-2 text-yellow-800">
            <Link className="w-4 h-4" />
            <span className="text-sm font-medium">
              Waiting for your friend to join...
            </span>
          </div>
          <p className="text-xs text-yellow-600 mt-1">
            Share the link above or give them the Game ID: <strong>{onlineState.gameId}</strong>
          </p>
        </div>
      )}
    </div>
  );
}