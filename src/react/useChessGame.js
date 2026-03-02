import { useCallback, useMemo, useState } from 'react';
import { ChessGame, GAME_MODE } from '../core/chessGame.js';

/**
 * React adapter for ChessGame engine.
 *
 * Example usage:
 * const {
 *   state, makeMove, newGame, resetGame,
 *   mode, setMode,
 *   legalMovesForSquare
 * } = useChessGame();
 */
export function useChessGame(initialOptions = {}) {
  const game = useMemo(() => new ChessGame(initialOptions), []);
  const [state, setState] = useState(game.getState());

  const syncState = useCallback(() => {
    setState(game.getState());
  }, [game]);

  const makeMove = useCallback(
    (move) => {
      const result = game.makeMove(move);
      syncState();
      return result;
    },
    [game, syncState],
  );

  const resetGame = useCallback(() => {
    game.resetGame();
    syncState();
  }, [game, syncState]);

  const newGame = useCallback(
    (options) => {
      game.newGame(options);
      syncState();
    },
    [game, syncState],
  );

  const setMode = useCallback(
    (mode, extraOptions = {}) => {
      game.newGame({ ...extraOptions, mode });
      syncState();
    },
    [game, syncState],
  );

  const legalMovesForSquare = useCallback(
    (square) => game.getLegalMoves(square),
    [game],
  );

  return {
    state,
    mode: state.mode,
    game,
    makeMove,
    resetGame,
    newGame,
    setMode,
    legalMovesForSquare,
    GAME_MODE,
  };
}
