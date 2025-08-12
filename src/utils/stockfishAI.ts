import { AIDifficulty } from '../types/chess';
import { Chess } from 'chess.js';

export class StockfishAI {
  private isReady = true;

  constructor() {
    console.log('AI initialized');
  }

  async getBestMove(fen: string, difficulty: AIDifficulty): Promise<{ from: string; to: string; promotion?: string } | null> {
    return new Promise((resolve) => {
      console.log('AI analyzing position:', fen);
      
      // Use chess.js to get legal moves
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      
      console.log('Available moves:', moves.length);
      
      if (moves.length === 0) {
        console.log('No legal moves available');
        resolve(null);
        return;
      }

      // Simulate thinking time based on difficulty
      const thinkingTime = this.getDifficultyTime(difficulty);
      
      setTimeout(() => {
        let selectedMove;
        
        switch (difficulty) {
          case 'easy':
            // Random move
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
            break;
            
          case 'medium':
            // Prefer captures and checks
            const captures = moves.filter(move => move.captured);
            const checks = moves.filter(move => {
              const testChess = new Chess(fen);
              testChess.move(move);
              return testChess.inCheck();
            });
            
            if (captures.length > 0 && Math.random() > 0.5) {
              selectedMove = captures[Math.floor(Math.random() * captures.length)];
            } else if (checks.length > 0 && Math.random() > 0.7) {
              selectedMove = checks[Math.floor(Math.random() * checks.length)];
            } else {
              selectedMove = moves[Math.floor(Math.random() * moves.length)];
            }
            break;
            
          case 'hard':
            // More strategic play
            const tacticalMoves = moves.filter(move => 
              move.captured || 
              move.promotion || 
              move.flags.includes('k') || 
              move.flags.includes('q') ||
              move.flags.includes('e')
            );
            
            if (tacticalMoves.length > 0 && Math.random() > 0.3) {
              selectedMove = tacticalMoves[Math.floor(Math.random() * tacticalMoves.length)];
            } else {
              selectedMove = moves[Math.floor(Math.random() * moves.length)];
            }
            break;
            
          default:
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
        }
        
        console.log('AI selected move:', selectedMove);
        
        // Return move in format that can be used directly
        resolve({
          from: selectedMove.from,
          to: selectedMove.to,
          promotion: selectedMove.promotion
        });
      }, thinkingTime);
    });
  }

  private getDifficultyTime(difficulty: AIDifficulty): number {
    switch (difficulty) {
      case 'easy': return 500;
      case 'medium': return 1000;
      case 'hard': return 1500;
      default: return 1000;
    }
  }

  destroy(): void {
    this.isReady = false;
  }
}