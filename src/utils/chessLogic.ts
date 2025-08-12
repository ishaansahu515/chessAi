import { Chess } from 'chess.js';
import { ChessPiece, PieceColor, PieceType } from '../types/chess';

export class ChessGame {
  private chess: Chess;
  
  constructor() {
    this.chess = new Chess();
  }

  getBoard(): (ChessPiece | null)[][] {
    const board: (ChessPiece | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = this.chess.get(this.getSquareName(row, col));
        if (square) {
          board[row][col] = {
            type: square.type as PieceType,
            color: square.color as PieceColor
          };
        }
      }
    }
    
    return board;
  }

  private getSquareName(row: number, col: number): string {
    const files = 'abcdefgh';
    const ranks = '87654321';
    return files[col] + ranks[row];
  }

  private getCoordinates(square: string): [number, number] {
    const files = 'abcdefgh';
    const ranks = '87654321';
    const col = files.indexOf(square[0]);
    const row = ranks.indexOf(square[1]);
    return [row, col];
  }

  makeMove(from: [number, number], to: [number, number], promotion?: string): boolean {
    const fromSquare = this.getSquareName(from[0], from[1]);
    const toSquare = this.getSquareName(to[0], to[1]);
    
    try {
      const move = this.chess.move({
        from: fromSquare,
        to: toSquare,
        promotion: promotion || 'q' // Auto-promote to queen if not specified
      });
      return move !== null;
    } catch {
      return false;
    }
  }

  // Make move using SAN notation (for AI moves)
  makeMoveSAN(san: string): boolean {
    try {
      const move = this.chess.move(san);
      return move !== null;
    } catch (error) {
      console.error('Invalid SAN move:', san, error);
      return false;
    }
  }

  getPossibleMoves(row: number, col: number): [number, number][] {
    const square = this.getSquareName(row, col);
    const moves = this.chess.moves({ square, verbose: true });
    
    return moves.map(move => this.getCoordinates(move.to));
  }

  // Get all legal moves for current position
  getAllLegalMoves(): string[] {
    return this.chess.moves();
  }

  getTurn(): PieceColor {
    return this.chess.turn() as PieceColor;
  }

  isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  getGameResult(): 'checkmate' | 'draw' | 'stalemate' | null {
    if (this.chess.isCheckmate()) return 'checkmate';
    if (this.chess.isDraw()) return 'draw';
    if (this.chess.isStalemate()) return 'stalemate';
    return null;
  }

  isInCheck(): boolean {
    return this.chess.inCheck();
  }

  // Check if castling is available
  canCastle(): { kingside: boolean; queenside: boolean } {
    const moves = this.chess.moves({ verbose: true });
    const castlingMoves = moves.filter(move => move.flags.includes('k') || move.flags.includes('q'));
    
    return {
      kingside: castlingMoves.some(move => move.flags.includes('k')),
      queenside: castlingMoves.some(move => move.flags.includes('q'))
    };
  }

  // Check if en passant is available
  getEnPassantSquare(): string | null {
    const fen = this.chess.fen();
    const fenParts = fen.split(' ');
    const enPassant = fenParts[3];
    return enPassant === '-' ? null : enPassant;
  }

  getMoveHistory(): string[] {
    return this.chess.history();
  }

  getLastMove(): [[number, number], [number, number]] | null {
    const history = this.chess.history({ verbose: true });
    if (history.length === 0) return null;
    
    const lastMove = history[history.length - 1];
    return [
      this.getCoordinates(lastMove.from),
      this.getCoordinates(lastMove.to)
    ];
  }

  getFEN(): string {
    return this.chess.fen();
  }

  loadFEN(fen: string): boolean {
    try {
      this.chess.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  reset(): void {
    this.chess.reset();
  }

  getCapturedPieces(): { white: ChessPiece[]; black: ChessPiece[] } {
    const captured = { white: [] as ChessPiece[], black: [] as ChessPiece[] };
    const history = this.chess.history({ verbose: true });
    
    for (const move of history) {
      if (move.captured) {
        const capturedPiece: ChessPiece = {
          type: move.captured as PieceType,
          color: move.color === 'w' ? 'b' : 'w' as PieceColor
        };
        if (capturedPiece.color === 'w') {
          captured.white.push(capturedPiece);
        } else {
          captured.black.push(capturedPiece);
        }
      }
    }
    
    return captured;
  }

  // Get move details for special moves visualization
  getMoveDetails(from: [number, number], to: [number, number]): {
    isCapture: boolean;
    isCastling: boolean;
    isEnPassant: boolean;
    isPromotion: boolean;
  } {
    const fromSquare = this.getSquareName(from[0], from[1]);
    const toSquare = this.getSquareName(to[0], to[1]);
    
    const moves = this.chess.moves({ square: fromSquare, verbose: true });
    const move = moves.find(m => m.to === toSquare);
    
    if (!move) {
      return { isCapture: false, isCastling: false, isEnPassant: false, isPromotion: false };
    }
    
    return {
      isCapture: !!move.captured,
      isCastling: move.flags.includes('k') || move.flags.includes('q'),
      isEnPassant: move.flags.includes('e'),
      isPromotion: move.flags.includes('p')
    };
  }
}