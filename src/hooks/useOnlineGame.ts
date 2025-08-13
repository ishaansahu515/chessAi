import { useState, useEffect, useCallback } from 'react';
import { OnlineGameState, PieceColor } from '../types/chess';
import { socketService } from '../utils/socketService';
import { v4 as uuidv4 } from 'uuid';

export function useOnlineGame() {
  const [onlineState, setOnlineState] = useState<OnlineGameState>({
    gameId: '',
    playerColor: null,
    isConnected: false,
    opponentConnected: false,
    isHost: false
  });

  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  const connectToServer = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      await socketService.connect();
      setConnectionStatus('connected');
      setOnlineState(prev => ({ ...prev, isConnected: true }));
    } catch (error) {
      console.error('Failed to connect:', error);
      setConnectionStatus('disconnected');
    }
  }, []);

  const createGame = useCallback(async () => {
    if (!socketService.isConnected()) {
      await connectToServer();
    }
    
    const gameId = uuidv4().substring(0, 8).toUpperCase();
    socketService.createGame(gameId);
    
    setOnlineState(prev => ({
      ...prev,
      gameId,
      playerColor: 'w', // Host plays white
      isHost: true
    }));
  }, [connectToServer]);

  const joinGame = useCallback(async (gameId: string) => {
    if (!socketService.isConnected()) {
      await connectToServer();
    }
    
    socketService.joinGame(gameId);
    
    setOnlineState(prev => ({
      ...prev,
      gameId: gameId.toUpperCase(),
      playerColor: 'b', // Joiner plays black
      isHost: false
    }));
  }, [connectToServer]);

  const sendMove = useCallback((from: [number, number], to: [number, number]) => {
    socketService.sendMove(from, to);
  }, []);

  const sendReset = useCallback(() => {
    socketService.sendReset();
  }, []);

  const leaveGame = useCallback(() => {
    socketService.disconnect();
    setOnlineState({
      gameId: '',
      playerColor: null,
      isConnected: false,
      opponentConnected: false,
      isHost: false
    });
    setConnectionStatus('disconnected');
  }, []);

  const getShareableLink = useCallback(() => {
    if (onlineState.gameId) {
      return `${window.location.origin}${window.location.pathname}?game=${onlineState.gameId}`;
    }
    return '';
  }, [onlineState.gameId]);

  // Set up socket event listeners
  useEffect(() => {
    if (connectionStatus === 'connected') {
      socketService.onGameCreated((data) => {
        console.log('Game created:', data);
      });

      socketService.onGameJoined((data) => {
        console.log('Game joined:', data);
      });

      socketService.onPlayerJoined(() => {
        setOnlineState(prev => ({ ...prev, opponentConnected: true }));
      });

      socketService.onPlayerLeft(() => {
        setOnlineState(prev => ({ ...prev, opponentConnected: false }));
      });
    }

    return () => {
      // Cleanup listeners when component unmounts
    };
  }, [connectionStatus]);

  // Check for game ID in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId) {
      joinGame(gameId);
    }
  }, [joinGame]);

  return {
    onlineState,
    connectionStatus,
    createGame,
    joinGame,
    sendMove,
    sendReset,
    leaveGame,
    getShareableLink
  };
}