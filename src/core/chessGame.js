import { Chess } from 'chess.js';

export const GAME_MODE = {
  LOCAL_1V1: 'local-1v1',
  VS_COMPUTER: 'vs-computer',
};

const DEFAULT_OPTIONS = {
  mode: GAME_MODE.LOCAL_1V1,
  humanColor: 'w',
};

/**
 * Core chess gameplay engine for MVP.
 * Framework-agnostic: can be used directly or via a React hook.
 */
export class ChessGame {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this._initGame();
  }

  _initGame() {
    this.chess = new Chess();
    this.moveHistory = [];
    this.result = null;
    this.lastMove = null;
    this._syncStatus();

    if (this._isComputerTurn()) {
      this.makeComputerMove();
    }
  }

  _syncStatus() {
    this.status = {
      turn: this.chess.turn(),
      isGameOver: this.chess.isGameOver(),
      isCheck: this.chess.inCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw(),
      isStalemate: this.chess.isStalemate(),
      isThreefoldRepetition: this.chess.isThreefoldRepetition(),
      isInsufficientMaterial: this.chess.isInsufficientMaterial(),
    };

    this.result = this._computeResult();
  }

  _computeResult() {
    if (!this.chess.isGameOver()) return null;

    if (this.chess.isCheckmate()) {
      const winner = this.chess.turn() === 'w' ? 'b' : 'w';
      return {
        type: 'checkmate',
        winner,
      };
    }

    if (this.chess.isStalemate()) {
      return { type: 'stalemate', winner: null };
    }

    if (this.chess.isThreefoldRepetition()) {
      return { type: 'threefold-repetition', winner: null };
    }

    if (this.chess.isInsufficientMaterial()) {
      return { type: 'insufficient-material', winner: null };
    }

    if (this.chess.isDraw()) {
      return { type: 'draw', winner: null };
    }

    return { type: 'game-over', winner: null };
  }

  _isComputerTurn() {
    return (
      this.options.mode === GAME_MODE.VS_COMPUTER &&
      this.chess.turn() !== this.options.humanColor &&
      !this.chess.isGameOver()
    );
  }

  _normalizeMove(move) {
    if (typeof move === 'string') {
      return { from: move.slice(0, 2), to: move.slice(2, 4), promotion: move.slice(4, 5) || 'q' };
    }

    return {
      from: move.from,
      to: move.to,
      promotion: move.promotion || 'q',
    };
  }

  _recordMove(moveObj) {
    this.lastMove = moveObj;
    this.moveHistory.push({
      index: this.moveHistory.length + 1,
      color: moveObj.color,
      from: moveObj.from,
      to: moveObj.to,
      san: moveObj.san,
      lan: moveObj.lan,
      piece: moveObj.piece,
      captured: moveObj.captured || null,
      promotion: moveObj.promotion || null,
      fenAfter: this.chess.fen(),
    });
  }

  getLegalMoves(fromSquare = null) {
    if (fromSquare) {
      return this.chess.moves({ square: fromSquare, verbose: true });
    }

    return this.chess.moves({ verbose: true });
  }

  makeMove(move) {
    if (this.chess.isGameOver()) {
      return { ok: false, error: 'Game is already over.' };
    }

    if (this._isComputerTurn()) {
      return { ok: false, error: 'It is computer turn.' };
    }

    const normalized = this._normalizeMove(move);
    const moveObj = this.chess.move(normalized);

    if (!moveObj) {
      return { ok: false, error: 'Illegal move.' };
    }

    this._recordMove(moveObj);
    this._syncStatus();

    const response = {
      ok: true,
      playerMove: moveObj,
      computerMove: null,
      state: this.getState(),
    };

    if (this._isComputerTurn()) {
      const comp = this.makeComputerMove();
      response.computerMove = comp.ok ? comp.move : null;
      response.state = this.getState();
    }

    return response;
  }

  makeComputerMove() {
    if (!this._isComputerTurn()) {
      return { ok: false, error: 'Computer move is not available now.' };
    }

    const legalMoves = this.chess.moves({ verbose: true });
    if (!legalMoves.length) {
      this._syncStatus();
      return { ok: false, error: 'No legal moves for computer.' };
    }

    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
    const moveObj = this.chess.move({
      from: randomMove.from,
      to: randomMove.to,
      promotion: randomMove.promotion || 'q',
    });

    this._recordMove(moveObj);
    this._syncStatus();

    return { ok: true, move: moveObj, state: this.getState() };
  }

  resetGame() {
    const currentMode = this.options.mode;
    const currentHumanColor = this.options.humanColor;
    this.options = { mode: currentMode, humanColor: currentHumanColor };
    this._initGame();
    return this.getState();
  }

  newGame(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this._initGame();
    return this.getState();
  }

  getState() {
    return {
      mode: this.options.mode,
      humanColor: this.options.humanColor,
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      turn: this.status.turn,
      isGameOver: this.status.isGameOver,
      isCheck: this.status.isCheck,
      result: this.result,
      lastMove: this.lastMove,
      history: [...this.moveHistory],
    };
  }
}
