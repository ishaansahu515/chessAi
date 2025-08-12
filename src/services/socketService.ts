import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private gameId: string | null = null;

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const serverUrl = import.meta.env.PROD 
        ? window.location.origin 
        : 'http://localhost:3001';

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket?.id);
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGame(gameId: string, playerName: string) {
    if (!this.socket) {
      throw new Error('Socket not connected');
    }
    
    this.gameId = gameId;
    this.socket.emit('join-game', { gameId, playerName });
  }

  makeMove(move: any, newFen: string, moveHistory: string[]) {
    if (!this.socket || !this.gameId) {
      throw new Error('Socket not connected or no game joined');
    }

    this.socket.emit('make-move', {
      gameId: this.gameId,
      move,
      newFen,
      moveHistory
    });
  }

  gameOver(winner: string | null, reason: string) {
    if (!this.socket || !this.gameId) {
      throw new Error('Socket not connected or no game joined');
    }

    this.socket.emit('game-over', {
      gameId: this.gameId,
      winner,
      reason
    });
  }

  onGameJoined(callback: (data: any) => void) {
    this.socket?.on('game-joined', callback);
  }

  onPlayerJoined(callback: (data: any) => void) {
    this.socket?.on('player-joined', callback);
  }

  onMoveMade(callback: (data: any) => void) {
    this.socket?.on('move-made', callback);
  }

  onGameEnded(callback: (data: any) => void) {
    this.socket?.on('game-ended', callback);
  }

  onPlayerDisconnected(callback: (data: any) => void) {
    this.socket?.on('player-disconnected', callback);
  }

  onError(callback: (data: any) => void) {
    this.socket?.on('error', callback);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  getSocket() {
    return this.socket;
  }
}

export const socketService = new SocketService();