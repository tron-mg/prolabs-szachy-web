/* eslint-disable @typescript-eslint/no-explicit-any */
import { Chess } from 'chess.js';

export const GAME_MODE = {
  LOCAL_1V1: 'local-1v1',
  VS_COMPUTER: 'vs-computer',
} as const;

export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
} as const;

type Color = 'w' | 'b';

type GameOptions = {
  mode: string;
  humanColor: Color;
  difficulty: string;
};

const DEFAULT_OPTIONS: GameOptions = {
  mode: GAME_MODE.LOCAL_1V1,
  humanColor: 'w',
  difficulty: DIFFICULTY.MEDIUM,
};

const PIECE_VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const DIFFICULTY_DEPTH: Record<string, number> = {
  [DIFFICULTY.EASY]: 1,
  [DIFFICULTY.MEDIUM]: 2,
  [DIFFICULTY.HARD]: 3,
};

export class ChessGame {
  options: GameOptions;
  chess!: Chess;
  moveHistory!: any[];
  result: any;
  lastMove: any;
  status: any;

  constructor(options: Partial<GameOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this._initGame();
  }

  _initGame() {
    this.chess = new Chess();
    this.moveHistory = [];
    this.result = null;
    this.lastMove = null;
    this._syncStatus();
    if (this._isComputerTurn()) this.makeComputerMove();
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
    if (this.chess.isCheckmate()) return { type: 'checkmate', winner: this.chess.turn() === 'w' ? 'b' : 'w' };
    if (this.chess.isStalemate()) return { type: 'stalemate', winner: null };
    if (this.chess.isThreefoldRepetition()) return { type: 'threefold-repetition', winner: null };
    if (this.chess.isInsufficientMaterial()) return { type: 'insufficient-material', winner: null };
    if (this.chess.isDraw()) return { type: 'draw', winner: null };
    return { type: 'game-over', winner: null };
  }

  _isComputerTurn() {
    return this.options.mode === GAME_MODE.VS_COMPUTER && this.chess.turn() !== this.options.humanColor && !this.chess.isGameOver();
  }

  _normalizeMove(move: any) {
    if (typeof move === 'string') return { from: move.slice(0, 2), to: move.slice(2, 4), promotion: move.slice(4, 5) || 'q' };
    return { from: move.from, to: move.to, promotion: move.promotion || 'q' };
  }

  _recordMove(moveObj: any) {
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

  _chooseMoveByDifficulty() {
    const legalMoves = this.chess.moves({ verbose: true }) as any[];
    if (!legalMoves.length) return null;
    if (this.options.difficulty === DIFFICULTY.EASY) return this._chooseEasyMove(legalMoves);

    const depth = DIFFICULTY_DEPTH[this.options.difficulty] || 2;
    const maximizingColor = this.chess.turn();
    let bestScore = -Infinity;
    let bestMoves: any[] = [];

    for (const move of legalMoves) {
      this.chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      const score = this._minimax(depth - 1, -Infinity, Infinity, false, maximizingColor as Color);
      this.chess.undo();
      if (score > bestScore) {
        bestScore = score;
        bestMoves = [move];
      } else if (score === bestScore) bestMoves.push(move);
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)] || legalMoves[0];
  }

  _chooseEasyMove(legalMoves: any[]) {
    const tacticalMoves = legalMoves.filter((m) => m.captured || m.san.includes('+') || m.san.includes('#'));
    const source = tacticalMoves.length ? tacticalMoves : legalMoves;
    return source[Math.floor(Math.random() * source.length)];
  }

  _minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean, maximizingColor: Color) {
    if (depth === 0 || this.chess.isGameOver()) return this._evaluateBoard(maximizingColor);
    const moves = this.chess.moves({ verbose: true }) as any[];
    if (!moves.length) return this._evaluateBoard(maximizingColor);

    if (isMaximizing) {
      let best = -Infinity;
      for (const move of moves) {
        this.chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
        best = Math.max(best, this._minimax(depth - 1, alpha, beta, false, maximizingColor));
        this.chess.undo();
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    }

    let best = Infinity;
    for (const move of moves) {
      this.chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
      best = Math.min(best, this._minimax(depth - 1, alpha, beta, true, maximizingColor));
      this.chess.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  _evaluateBoard(maximizingColor: Color) {
    if (this.chess.isCheckmate()) return this.chess.turn() === maximizingColor ? -999999 : 999999;
    if (this.chess.isDraw() || this.chess.isStalemate() || this.chess.isInsufficientMaterial()) return 0;

    const board = this.chess.board();
    let score = 0;
    for (let rank = 0; rank < 8; rank += 1) {
      for (let file = 0; file < 8; file += 1) {
        const piece = board[rank][file];
        if (!piece) continue;
        const base = PIECE_VALUES[piece.type] || 0;
        const centrality = this._centralityBonus(rank, file, piece.type);
        const pieceScore = base + centrality;
        score += piece.color === maximizingColor ? pieceScore : -pieceScore;
      }
    }
    if (this.chess.inCheck()) score += this.chess.turn() === maximizingColor ? -35 : 35;
    return score;
  }

  _centralityBonus(rank: number, file: number, type: string) {
    if (type === 'k' || type === 'p') return 0;
    const centerDistance = Math.abs(3.5 - rank) + Math.abs(3.5 - file);
    return Math.round((7 - centerDistance) * 2);
  }

  getLegalMoves(fromSquare: string | null = null) {
    if (fromSquare) return this.chess.moves({ square: fromSquare as any, verbose: true });
    return this.chess.moves({ verbose: true });
  }

  makeMove(move: any) {
    if (this.chess.isGameOver()) return { ok: false, error: 'Game is already over.' };
    if (this._isComputerTurn()) return { ok: false, error: 'It is computer turn.' };

    const normalized = this._normalizeMove(move);
    const moveObj = this.chess.move(normalized);
    if (!moveObj) return { ok: false, error: 'Illegal move.' };

    this._recordMove(moveObj);
    this._syncStatus();

    const response: any = { ok: true, playerMove: moveObj, computerMove: null, state: this.getState() as any };
    if (this._isComputerTurn()) {
      const comp = this.makeComputerMove();
      response.computerMove = comp.ok ? comp.move : null;
      response.state = this.getState();
    }
    return response;
  }

  makeComputerMove() {
    if (!this._isComputerTurn()) return { ok: false, error: 'Computer move is not available now.' };
    const chosen = this._chooseMoveByDifficulty();
    if (!chosen) {
      this._syncStatus();
      return { ok: false, error: 'No legal moves for computer.' };
    }

    const moveObj = this.chess.move({ from: chosen.from, to: chosen.to, promotion: chosen.promotion || 'q' });
    this._recordMove(moveObj);
    this._syncStatus();
    return { ok: true, move: moveObj, state: this.getState() };
  }

  undoMove() {
    if (this.moveHistory.length === 0) return { ok: false, error: 'No moves to undo.' };
    const undos = this.options.mode === GAME_MODE.VS_COMPUTER && this.moveHistory.length >= 2 ? 2 : 1;
    for (let i = 0; i < undos; i += 1) {
      const undone = this.chess.undo();
      if (!undone) break;
      this.moveHistory.pop();
    }
    this.lastMove = this.moveHistory[this.moveHistory.length - 1] || null;
    this._syncStatus();
    return { ok: true, state: this.getState() };
  }

  resetGame() {
    const { mode, humanColor, difficulty } = this.options;
    this.options = { mode, humanColor, difficulty };
    this._initGame();
    return this.getState();
  }

  newGame(options: Partial<GameOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this._initGame();
    return this.getState();
  }

  getState() {
    return {
      mode: this.options.mode,
      humanColor: this.options.humanColor,
      difficulty: this.options.difficulty,
      fen: this.chess.fen(),
      pgn: this.chess.pgn(),
      board: this.chess.board(),
      turn: this.status.turn,
      isGameOver: this.status.isGameOver,
      isCheck: this.status.isCheck,
      result: this.result,
      lastMove: this.lastMove,
      history: [...this.moveHistory],
    };
  }
}
