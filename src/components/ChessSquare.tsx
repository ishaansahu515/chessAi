import React, { useState } from 'react';
import { ChessPiece } from './ChessPiece';
import { ChessPiece as ChessPieceType } from '../types/chess';

interface ChessSquareProps {
  piece: ChessPieceType | null;
  isLight: boolean;
  isSelected: boolean;
  isPossibleMove: boolean;
  isLastMove: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export function ChessSquare({
  piece,
  isLight,
  isSelected,
  isPossibleMove,
  isLastMove,
  onClick,
  onDragStart,
  onDragOver,
  onDrop
}: ChessSquareProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const getSquareColor = () => {
    if (isSelected) return 'bg-yellow-400';
    if (isLastMove) return 'bg-yellow-300';
    if (isDragOver && isPossibleMove) return 'bg-green-400';
    if (isLight) return 'bg-amber-100';
    return 'bg-amber-800';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div
      className={`
        w-12 h-12 md:w-16 md:h-16 flex items-center justify-center relative cursor-pointer
        transition-colors duration-200 ${getSquareColor()}
        hover:brightness-110
      `}
      onClick={onClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {piece && (
        <div
          draggable
          onDragStart={onDragStart}
          className="z-10"
        >
          <ChessPiece piece={piece} />
        </div>
      )}
      
      {isPossibleMove && (
        <div 
          className={`
            absolute inset-0 flex items-center justify-center
            ${piece ? 'border-2 md:border-4 border-green-500 rounded-full' : ''}
          `}
        >
          {!piece && (
            <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full opacity-60" />
          )}
        </div>
      )}
    </div>
  );
}