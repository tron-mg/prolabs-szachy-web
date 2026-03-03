/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useRef, useState } from 'react';
import { ChessGame, GAME_MODE, DIFFICULTY } from '../core/chessGame';

export function useChessGame(initialOptions: Record<string, unknown> = {}) {
  const gameRef = useRef<ChessGame | null>(null);

  if (!gameRef.current) {
    gameRef.current = new ChessGame(initialOptions as any);
  }

  const game = gameRef.current;
  const [state, setState] = useState(game.getState());

  const syncState = useCallback(() => {
    setState(game.getState());
  }, [game]);

  const makeMove = useCallback(
    (move: unknown) => {
      const result = game.makeMove(move as any);
      syncState();
      return result;
    },
    [game, syncState],
  );

  const undoMove = useCallback(() => {
    const result = game.undoMove();
    syncState();
    return result;
  }, [game, syncState]);

  const resetGame = useCallback(() => {
    game.resetGame();
    syncState();
  }, [game, syncState]);

  const newGame = useCallback(
    (options: Record<string, unknown>) => {
      game.newGame(options as any);
      syncState();
    },
    [game, syncState],
  );

  const setMode = useCallback(
    (mode: string, extraOptions: Record<string, unknown> = {}) => {
      game.newGame({ ...extraOptions, mode } as any);
      syncState();
    },
    [game, syncState],
  );

  const legalMovesForSquare = useCallback((square: string) => game.getLegalMoves(square), [game]);

  return {
    state,
    mode: state.mode,
    game,
    makeMove,
    undoMove,
    resetGame,
    newGame,
    setMode,
    legalMovesForSquare,
    GAME_MODE,
    DIFFICULTY,
  };
}
