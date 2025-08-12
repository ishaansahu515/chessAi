export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export interface Square {
  piece: ChessPiece | null;
  isHighlighted: boolean;
  isPossibleMove: boolean;
  isSelected: boolean;
  isLastMove: boolean;
}

export interface GameState {
  board: (ChessPiece | null)[][];
  turn: PieceColor;
  isGameOver: boolean;
  winner: PieceColor | 'draw' | null;
  selectedSquare: [number, number] | null;
  possibleMoves: [number, number][];
  moveHistory: string[];
  capturedPieces: { white: ChessPiece[]; black: ChessPiece[] };
  lastMove: [[number, number], [number, number]] | null;
}

export type GameMode = 'human-vs-human' | 'human-vs-ai';
export type AIDifficulty = 'easy' | 'medium' | 'hard';