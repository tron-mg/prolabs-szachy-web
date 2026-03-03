"use client";

import { useMemo, useState } from "react";
import { useChessGame } from "../src/react/useChessGame";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const pieceSymbols: Record<string, string> = {
  wp: "♙",
  wn: "♘",
  wb: "♗",
  wr: "♖",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  bn: "♞",
  bb: "♝",
  br: "♜",
  bq: "♛",
  bk: "♚",
};

type PromotionPiece = "q" | "r" | "b" | "n";

type PendingPromotion = {
  from: string;
  to: string;
};

function squareColor(rank: number, fileIndex: number) {
  return (rank + fileIndex) % 2 === 0 ? "square-light" : "square-dark";
}

function toBoardIndex(square: string) {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(square[1]);
  return { row: 8 - rank, col: file };
}

function gameStatusText(state: {
  isGameOver: boolean;
  isCheck: boolean;
  turn: string;
  result: { type: string; winner: string | null } | null;
}) {
  if (!state.isGameOver) {
    return state.isCheck
      ? `Szach! Ruch: ${state.turn === "w" ? "Białe" : "Czarne"}`
      : `Ruch: ${state.turn === "w" ? "Białe" : "Czarne"}`;
  }

  if (!state.result) return "Koniec gry";

  if (state.result.type === "checkmate") {
    return `🏆 Mat! Wygrywają ${state.result.winner === "w" ? "Białe" : "Czarne"}!`;
  }

  return "🤝 Remis";
}

export default function Home() {
  const { state, makeMove, undoMove, newGame, GAME_MODE, DIFFICULTY, legalMovesForSquare } =
    useChessGame();

  const [orientation, setOrientation] = useState<"w" | "b">("w");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(DIFFICULTY.MEDIUM);
  const [humanColor, setHumanColor] = useState<"w" | "b">("w");
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);

  const boardFiles = orientation === "w" ? files : [...files].reverse();
  const boardRanks = orientation === "w" ? ranks : [...ranks].reverse();

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return new Set<string>();
    const moves = legalMovesForSquare(selectedSquare) as Array<{ to: string }>;
    return new Set(moves.map((m) => m.to));
  }, [legalMovesForSquare, selectedSquare]);

  const winner = state.result?.winner;

  function getPieceAt(square: string) {
    const { row, col } = toBoardIndex(square);
    const piece = state.board?.[row]?.[col];
    if (!piece) return null;
    return pieceSymbols[`${piece.color}${piece.type}`] || null;
  }

  function isPromotionMove(from: string, to: string) {
    const { row, col } = toBoardIndex(from);
    const piece = state.board?.[row]?.[col];
    if (!piece || piece.type !== "p") return false;
    const targetRank = Number(to[1]);
    return (piece.color === "w" && targetRank === 8) || (piece.color === "b" && targetRank === 1);
  }

  function handleSquareClick(square: string) {
    if (state.isGameOver || pendingPromotion) return;

    if (!selectedSquare) {
      const moves = legalMovesForSquare(square);
      if (moves.length) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    const legalMoves = legalMovesForSquare(selectedSquare) as Array<{
      to: string;
      promotion?: string;
    }>;
    const matchingMove = legalMoves.find((m) => m.to === square);

    if (!matchingMove) {
      const newOriginMoves = legalMovesForSquare(square);
      setSelectedSquare(newOriginMoves.length ? square : null);
      return;
    }

    if (isPromotionMove(selectedSquare, matchingMove.to)) {
      setPendingPromotion({ from: selectedSquare, to: matchingMove.to });
      return;
    }

    makeMove({
      from: selectedSquare,
      to: matchingMove.to,
      promotion: matchingMove.promotion || "q",
    });

    setSelectedSquare(null);
  }

  function handlePromotionSelect(piece: PromotionPiece) {
    if (!pendingPromotion) return;
    makeMove({ ...pendingPromotion, promotion: piece });
    setPendingPromotion(null);
    setSelectedSquare(null);
  }

  function startLocalGame() {
    newGame({ mode: GAME_MODE.LOCAL_1V1 });
    setSelectedSquare(null);
    setPendingPromotion(null);
  }

  function startComputerGame() {
    newGame({ mode: GAME_MODE.VS_COMPUTER, humanColor, difficulty });
    setOrientation(humanColor);
    setSelectedSquare(null);
    setPendingPromotion(null);
  }

  return (
    <main className="app-shell">
      <section className="top-bar">
        <h1>Prolabs Chess</h1>
        <p>Player vs Player / Player vs Computer · 3 poziomy AI</p>
      </section>

      <section className="game-layout">
        <article className="board-panel" aria-label="Chess board panel">
          <div className="board-header">
            <span>
              {state.mode === GAME_MODE.VS_COMPUTER
                ? `AI: ${state.difficulty} · grasz ${state.humanColor === "w" ? "białymi" : "czarnymi"}`
                : "Local PvP"}
            </span>
            <span>{gameStatusText(state)}</span>
          </div>

          <div className="board-frame" aria-label="Chessboard container">
            <div className="board-grid" role="grid" aria-label="Chess board">
              {boardRanks.map((rank) =>
                boardFiles.map((file, fileIndex) => {
                  const coordinate = `${file}${rank}`;
                  const piece = getPieceAt(coordinate);
                  const isSelected = selectedSquare === coordinate;
                  const isTarget = legalTargets.has(coordinate);
                  const isLastMove =
                    state.lastMove &&
                    (state.lastMove.from === coordinate || state.lastMove.to === coordinate);

                  return (
                    <button
                      key={coordinate}
                      type="button"
                      className={`square ${squareColor(rank, fileIndex)} ${
                        isSelected ? "selected" : ""
                      } ${isTarget ? "target" : ""} ${isLastMove ? "last-move" : ""}`}
                      aria-label={`Square ${coordinate}`}
                      onClick={() => handleSquareClick(coordinate)}
                    >
                      <span className="piece" aria-hidden>
                        {piece}
                      </span>
                      <span className="coordinate">{coordinate}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {pendingPromotion && (
            <div className="promotion-modal" role="dialog" aria-label="Wybór promocji pionka">
              <span>Wybierz figurę do promocji:</span>
              <div className="promotion-row">
                <button type="button" onClick={() => handlePromotionSelect("q")}>Hetman</button>
                <button type="button" onClick={() => handlePromotionSelect("r")}>Wieża</button>
                <button type="button" onClick={() => handlePromotionSelect("b")}>Goniec</button>
                <button type="button" onClick={() => handlePromotionSelect("n")}>Skoczek</button>
              </div>
            </div>
          )}

          {state.isGameOver && (
            <div className="celebration" role="status" aria-live="polite">
              {winner ? (
                <>
                  🎉🎉 Brawo! <strong>{winner === "w" ? "Białe" : "Czarne"}</strong> wygrywają! 🏆
                </>
              ) : (
                <>👏 Dobra partia! Mamy remis.</>
              )}
            </div>
          )}
        </article>

        <aside className="controls-panel" aria-label="Game controls">
          <div className="panel-card">
            <h2>Match Controls</h2>
            <div className="button-row">
              <button
                type="button"
                onClick={() =>
                  newGame(
                    state.mode === GAME_MODE.VS_COMPUTER
                      ? { mode: GAME_MODE.VS_COMPUTER, humanColor, difficulty }
                      : { mode: GAME_MODE.LOCAL_1V1 }
                  )
                }
              >
                New Game
              </button>
              <button type="button" onClick={() => undoMove()}>
                Undo
              </button>
              <button type="button" onClick={() => setOrientation((v) => (v === "w" ? "b" : "w"))}>
                Flip Board
              </button>
            </div>
          </div>

          <div className="panel-card">
            <h2>Mode</h2>
            <div className="button-column">
              <label className="difficulty-label">
                AI poziom:
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                >
                  <option value={DIFFICULTY.EASY}>Easy</option>
                  <option value={DIFFICULTY.MEDIUM}>Medium</option>
                  <option value={DIFFICULTY.HARD}>Hard</option>
                </select>
              </label>

              <label className="difficulty-label">
                Kolor gracza (PvC):
                <select
                  value={humanColor}
                  onChange={(e) => setHumanColor(e.target.value as "w" | "b")}
                >
                  <option value="w">Białe</option>
                  <option value="b">Czarne</option>
                </select>
              </label>

              <button type="button" onClick={startComputerGame}>
                Player vs Computer
              </button>
              <button type="button" onClick={startLocalGame}>
                Local Player vs Player
              </button>
            </div>
          </div>

          <div className="panel-card status-card">
            <h2>Game Status</h2>
            <ul>
              <li>Turn: {state.turn === "w" ? "White" : "Black"}</li>
              <li>Last move: {state.lastMove ? `${state.lastMove.from} → ${state.lastMove.to}` : "--"}</li>
              <li>Moves: {state.history.length}</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
