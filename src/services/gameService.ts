const API_BASE = import.meta.env.PROD 
  ? window.location.origin 
  : 'http://localhost:3001';

export interface CreateGameResponse {
  gameId: string;
  shareUrl: string;
}

export interface GameData {
  id: string;
  players: Array<{
    id: string;
    name: string;
    color: 'white' | 'black';
    connected: boolean;
  }>;
  gameState: {
    fen: string;
    turn: string;
    moveHistory: string[];
    isGameOver: boolean;
    winner: string | null;
  };
  createdAt: string;
}

export const gameService = {
  async createGame(): Promise<CreateGameResponse> {
    const response = await fetch(`${API_BASE}/api/create-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to create game');
    }

    return response.json();
  },

  async getGame(gameId: string): Promise<GameData> {
    const response = await fetch(`${API_BASE}/api/game/${gameId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Game not found');
      }
      throw new Error('Failed to get game');
    }

    return response.json();
  },
};