import { AIDifficulty } from '../types/chess';
import { Chess } from 'chess.js';

export class StockfishAI {
  private stockfish: Worker | null = null;
  private isReady = false;
  private currentCallback: ((move: string) => void) | null = null;

  constructor() {
    this.initStockfish();
  }

  private async initStockfish(): Promise<void> {
    try {
      // Create a simple AI that uses chess.js for move generation
      this.isReady = true;
      console.log('AI initialized with fallback random move generator');
    } catch (error) {
      console.error('Failed to initialize AI:', error);
      this.isReady = true;
    }
  }

  async getBestMove(fen: string, difficulty: AIDifficulty): Promise<string> {
    return new Promise((resolve) => {
      if (!this.isReady) {
        setTimeout(() => resolve(''), 100);
        return;
      }

      // Use chess.js to get legal moves and pick one based on difficulty
      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });
      
      if (moves.length === 0) {
        resolve('');
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
            
            if (captures.length > 0 && Math.random() > 0.3) {
              selectedMove = captures[Math.floor(Math.random() * captures.length)];
            } else if (checks.length > 0 && Math.random() > 0.5) {
              selectedMove = checks[Math.floor(Math.random() * checks.length)];
            } else {
              selectedMove = moves[Math.floor(Math.random() * moves.length)];
            }
            break;
            
          case 'hard':
            // More strategic: prefer center control, development, and tactics
            const centerMoves = moves.filter(move => 
              ['e4', 'e5', 'd4', 'd5', 'c4', 'c5', 'f4', 'f5'].includes(move.to)
            );
            const developmentMoves = moves.filter(move => 
              ['n', 'b'].includes(move.piece) && 
              !['a', 'h'].includes(move.to[0]) // Avoid edge moves
            );
            const tacticalMoves = moves.filter(move => move.captured || move.promotion);
            
            if (tacticalMoves.length > 0 && Math.random() > 0.2) {
              selectedMove = tacticalMoves[Math.floor(Math.random() * tacticalMoves.length)];
            } else if (centerMoves.length > 0 && Math.random() > 0.4) {
              selectedMove = centerMoves[Math.floor(Math.random() * centerMoves.length)];
            } else if (developmentMoves.length > 0 && Math.random() > 0.3) {
              selectedMove = developmentMoves[Math.floor(Math.random() * developmentMoves.length)];
            } else {
              selectedMove = moves[Math.floor(Math.random() * moves.length)];
            }
            break;
            
          default:
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
        }
        
        const uciMove = selectedMove.from + selectedMove.to + (selectedMove.promotion || '');
        resolve(uciMove);
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
    if (this.stockfish) {
      this.stockfish.terminate();
      this.stockfish = null;
    }
    this.isReady = false;
    this.currentCallback = null;
  }
}