import React from 'react';
import { ChessPiece as ChessPieceType } from '../types/chess';

interface ChessPieceProps {
  piece: ChessPieceType;
  isDragging?: boolean;
}

const pieceSymbols: Record<string, string> = {
  'wp': '♙', 'wr': '♖', 'wn': '♘', 'wb': '♗', 'wq': '♕', 'wk': '♔',
  'bp': '♟', 'br': '♜', 'bn': '♞', 'bb': '♝', 'bq': '♛', 'bk': '♚'
};

export function ChessPiece({ piece, isDragging = false }: ChessPieceProps) {
  const symbol = pieceSymbols[`${piece.color}${piece.type}`];
  
  return (
    <div 
      className={`
        text-4xl md:text-5xl select-none cursor-pointer transition-all duration-200
        ${isDragging ? 'scale-110 opacity-70' : 'hover:scale-105'}
        ${piece.color === 'w' ? 'text-amber-100 drop-shadow-md' : 'text-gray-800'}
      `}
      style={{
        filter: piece.color === 'w' 
          ? 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' 
          : 'drop-shadow(1px 1px 2px rgba(255,255,255,0.3))'
      }}
    >
      {symbol}
    </div>
  );
}