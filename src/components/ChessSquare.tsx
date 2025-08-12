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
  onDragEnd?: () => void;
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
  onDrop,
  onDragEnd
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
    
    // Ensure the drop event has the correct coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only proceed if the drop is within the square bounds
    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      onDrop(e);
    }
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
          onDragEnd={onDragEnd}
          className="z-10 w-full h-full flex items-center justify-center"
        >
          <ChessPiece piece={piece} />
        </div>
      )}
      
      {isPossibleMove && (
        <div 
          className={`
            absolute inset-0 flex items-center justify-center pointer-events-none
            ${piece ? 'border-2 md:border-4 border-green-500 rounded-full' : ''}
          `}
        >
          {!piece && (
            <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full opacity-70" />
          )}
        </div>
      )}
    </div>
  );
}