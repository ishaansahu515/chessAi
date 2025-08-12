import { AIDifficulty } from '../types/chess';
import { Chess } from 'chess.js';

export class StockfishAI {
  private isReady = true;

  constructor() {
    console.log('AI initialized');
  }

  async getBestMove(
    fen: string,
    difficulty: AIDifficulty
  ): Promise<{ from: string; to: string; promotion?: string } | null> {
    return new Promise((resolve) => {
      console.log('AI analyzing position:', fen);

      const chess = new Chess(fen);
      const moves = chess.moves({ verbose: true });

      console.log('Available moves:', moves.length);

      if (moves.length === 0) {
        console.log('No legal moves available');
        resolve(null);
        return;
      }

      const thinkingTime = this.getDifficultyTime(difficulty);

      setTimeout(() => {
        let selectedMove;

        // Detect special/tactical moves
        const captures = moves.filter(m => m.captured);
        const checks = moves.filter(m => {
          const test = new Chess(fen);
          test.move(m);
          return test.inCheck();
        });
        const promotions = moves.filter(m => m.promotion);
        const castles = moves.filter(m => m.flags.includes('k') || m.flags.includes('q'));
        const enPassants = moves.filter(m => m.flags.includes('e'));

        switch (difficulty) {
          case 'easy':
            // Random move only
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
            break;

          case 'medium':
            // Balanced play with preference for good moves
            if (captures.length && Math.random() > 0.4) {
              selectedMove = captures[Math.floor(Math.random() * captures.length)];
            } else if (castles.length && Math.random() > 0.3) {
              selectedMove = castles[Math.floor(Math.random() * castles.length)];
            } else if (checks.length && Math.random() > 0.6) {
              selectedMove = checks[Math.floor(Math.random() * checks.length)];
            } else if (enPassants.length && Math.random() > 0.6) {
              selectedMove = enPassants[Math.floor(Math.random() * enPassants.length)];
            } else {
              selectedMove = moves[Math.floor(Math.random() * moves.length)];
            }
            break;

          case 'hard':
            // Strong preference for tactical & special moves
            const tacticalMoves = [
              ...captures,
              ...checks,
              ...promotions,
              ...castles,
              ...enPassants
            ];

            if (tacticalMoves.length && Math.random() > 0.15) {
              selectedMove = tacticalMoves[Math.floor(Math.random() * tacticalMoves.length)];
            } else {
              selectedMove = moves[Math.floor(Math.random() * moves.length)];
            }
            break;

          default:
            selectedMove = moves[Math.floor(Math.random() * moves.length)];
        }

        console.log('AI selected move:', selectedMove);

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
