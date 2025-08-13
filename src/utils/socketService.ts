import { io, Socket } from 'socket.io-client';
import { GameMessage } from '../types/chess';

class SocketService {
  private socket: Socket | null = null;
  private gameId: string | null = null;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // For demo purposes, we'll simulate a WebSocket connection
        // In a real app, you'd connect to your actual server
        this.socket = {
          emit: (event: string, data: any) => {
            console.log('Emitting:', event, data);
            // Simulate server response
            setTimeout(() => {
              if (event === 'create-game') {
                this.handleGameCreated(data.gameId);
              } else if (event === 'join-game') {
                this.handleGameJoined(data.gameId);
              }
            }, 100);
          },
          on: (event: string, callback: Function) => {
            console.log('Listening for:', event);
            // Store callbacks for simulation
            (this as any)[`_${event}Callback`] = callback;
          },
          off: (event: string) => {
            console.log('Removing listener for:', event);
            delete (this as any)[`_${event}Callback`];
          },
          disconnect: () => {
            console.log('Disconnecting socket');
            this.socket = null;
          }
        } as any;
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleGameCreated(gameId: string) {
    const callback = (this as any)._gameCreatedCallback;
    if (callback) {
      callback({ gameId, isHost: true });
    }
  }

  private handleGameJoined(gameId: string) {
    const callback = (this as any)._gameJoinedCallback;
    if (callback) {
      callback({ gameId, isHost: false });
    }
  }

  createGame(gameId: string): void {
    if (this.socket) {
      this.gameId = gameId;
      this.socket.emit('create-game', { gameId });
    }
  }

  joinGame(gameId: string): void {
    if (this.socket) {
      this.gameId = gameId;
      this.socket.emit('join-game', { gameId });
    }
  }

  sendMove(from: [number, number], to: [number, number]): void {
    if (this.socket && this.gameId) {
      const message: GameMessage = {
        type: 'move',
        gameId: this.gameId,
        data: { from, to }
      };
      this.socket.emit('game-message', message);
      
      // Simulate receiving the move for demo
      setTimeout(() => {
        const callback = (this as any)._gameMessageCallback;
        if (callback) {
          callback(message);
        }
      }, 50);
    }
  }

  sendReset(): void {
    if (this.socket && this.gameId) {
      const message: GameMessage = {
        type: 'reset',
        gameId: this.gameId
      };
      this.socket.emit('game-message', message);
      
      // Simulate receiving the reset for demo
      setTimeout(() => {
        const callback = (this as any)._gameMessageCallback;
        if (callback) {
          callback(message);
        }
      }, 50);
    }
  }

  onGameCreated(callback: (data: { gameId: string; isHost: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('game-created', callback);
    }
  }

  onGameJoined(callback: (data: { gameId: string; isHost: boolean }) => void): void {
    if (this.socket) {
      this.socket.on('game-joined', callback);
    }
  }

  onGameMessage(callback: (message: GameMessage) => void): void {
    if (this.socket) {
      this.socket.on('game-message', callback);
    }
  }

  onPlayerJoined(callback: () => void): void {
    if (this.socket) {
      this.socket.on('player-joined', callback);
    }
  }

  onPlayerLeft(callback: () => void): void {
    if (this.socket) {
      this.socket.on('player-left', callback);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.gameId = null;
    }
  }

  isConnected(): boolean {
    return this.socket !== null;
  }
}

export const socketService = new SocketService();