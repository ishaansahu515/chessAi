import React, { useState } from 'react';
import { ChessSquare } from './ChessSquare';
import { GameState } from '../types/chess';

interface ChessBoardProps {
  gameState: GameState;
  onSquareClick: (row: number, col: number) => void;
  onMove: (from: [number, number], to: [number, number]) => void;
}

export function ChessBoard({ gameState, onSquareClick, onMove }: ChessBoardProps) {
  const [draggedPiece, setDraggedPiece] = useState<{
    from: [number, number];
    piece: any;
  } | null>(null);

  const handleDragStart = (row: number, col: number) => (e: React.DragEvent) => {
    const piece = gameState.board[row][col];
    if (piece && piece.color === gameState.turn) {
      setDraggedPiece({ from: [row, col], piece });
      e.dataTransfer.effectAllowed = 'move';
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (row: number, col: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedPiece) {
      onMove(draggedPiece.from, [row, col]);
      setDraggedPiece(null);
    }
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="bg-amber-900 p-4 rounded-lg shadow-2xl">
      {/* Rank labels (left side) */}
      <div className="flex">
        <div className="flex flex-col justify-around w-6 text-amber-100 text-sm font-bold">
          {ranks.map(rank => (
            <div key={rank} className="h-12 md:h-16 flex items-center justify-center">
              {rank}
            </div>
          ))}
        </div>
        
        <div className="flex flex-col">
          {/* Chess board */}
          <div className="grid grid-cols-8 border-2 border-amber-900">
            {gameState.board.map((row, rowIndex) =>
              row.map((piece, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const isSelected = gameState.selectedSquare && 
                  gameState.selectedSquare[0] === rowIndex && 
                  gameState.selectedSquare[1] === colIndex;
                const isPossibleMove = gameState.possibleMoves.some(
                  ([r, c]) => r === rowIndex && c === colIndex
                );
                const isLastMove = gameState.lastMove &&
                  ((gameState.lastMove[0][0] === rowIndex && gameState.lastMove[0][1] === colIndex) ||
                   (gameState.lastMove[1][0] === rowIndex && gameState.lastMove[1][1] === colIndex));

                return (
                  <ChessSquare
                    key={`${rowIndex}-${colIndex}`}
                    piece={piece}
                    isLight={isLight}
                    isSelected={isSelected}
                    isPossibleMove={isPossibleMove}
                    isLastMove={isLastMove}
                    onClick={() => onSquareClick(rowIndex, colIndex)}
                    onDragStart={handleDragStart(rowIndex, colIndex)}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop(rowIndex, colIndex)}
                  />
                );
              })
            )}
          </div>
          
          {/* File labels (bottom) */}
          <div className="flex justify-around mt-1 text-amber-100 text-sm font-bold">
            {files.map(file => (
              <div key={file} className="w-12 md:w-16 text-center">
                {file}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}