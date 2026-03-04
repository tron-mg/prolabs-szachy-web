"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChessGame } from "../src/react/useChessGame";
import { APP_VERSION } from "../src/config/version";

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

const pieceSets = {
  classic: {
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
  },
  minecraft: {
    wp: "🐷",
    wn: "🐺",
    wb: "🧙",
    wr: "🧱",
    wq: "🐉",
    wk: "🦸",
    bp: "🧟",
    bn: "🕷️",
    bb: "🧨",
    br: "⛏️",
    bq: "👹",
    bk: "💀",
  },
} as const;

type PromotionPiece = "q" | "r" | "b" | "n";
type PendingPromotion = { from: string; to: string };
type ClockState = { w: number; b: number };
type AnimatedMove = { from: string; to: string; id: number } | null;

function squareColor(rank: number, fileIndex: number) {
  return (rank + fileIndex) % 2 === 0 ? "square-light" : "square-dark";
}

function toBoardIndex(square: string) {
  const file = square.charCodeAt(0) - "a".charCodeAt(0);
  const rank = Number(square[1]);
  return { row: 8 - rank, col: file };
}

function formatClock(seconds: number) {
  const safe = Math.max(0, seconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
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
  const [voiceOn, setVoiceOn] = useState(true);
  const [skin, setSkin] = useState<"classic" | "minecraft">("classic");
  const [timeModeOn, setTimeModeOn] = useState(true);
  const [minutesPerSide, setMinutesPerSide] = useState(10);
  const [clock, setClock] = useState<ClockState>({ w: 600, b: 600 });
  const [timeWinner, setTimeWinner] = useState<"w" | "b" | null>(null);
  const [animatedMove, setAnimatedMove] = useState<AnimatedMove>(null);

  const initializedRef = useRef(false);
  const lastAnnouncedMoveRef = useRef(0);
  const lastAnimatedMoveRef = useRef(0);

  const boardFiles = orientation === "w" ? files : [...files].reverse();
  const boardRanks = orientation === "w" ? ranks : [...ranks].reverse();
  const currentPieceSet = pieceSets[skin];

  const legalTargets = useMemo(() => {
    if (!selectedSquare) return new Set<string>();
    const moves = legalMovesForSquare(selectedSquare) as Array<{ to: string }>;
    return new Set(moves.map((m) => m.to));
  }, [legalMovesForSquare, selectedSquare]);

  const captured = useMemo(() => {
    const byWhite: string[] = [];
    const byBlack: string[] = [];

    for (const move of state.history) {
      if (!move.captured) continue;
      const capturedColor = move.color === "w" ? "b" : "w";
      const symbol = currentPieceSet[`${capturedColor}${move.captured}` as keyof typeof currentPieceSet] || move.captured;
      if (move.color === "w") byWhite.push(symbol);
      else byBlack.push(symbol);
    }

    return { byWhite, byBlack };
  }, [state.history, currentPieceSet]);

  const winner = state.result?.winner;
  const hardGameOver = state.isGameOver || Boolean(timeWinner);

  const speak = useCallback(
    (text: string) => {
      if (!voiceOn || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pl-PL";
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    },
    [voiceOn]
  );

  useEffect(() => {
    if (!timeModeOn || hardGameOver) return;

    const id = window.setInterval(() => {
      setClock((prev) => {
        const side = state.turn as "w" | "b";
        const next = { ...prev, [side]: Math.max(0, prev[side] - 1) };

        if (next[side] === 0) {
          const winnerByTime = side === "w" ? "b" : "w";
          setTimeWinner(winnerByTime);
          speak(`Czas minął. Wygrywają ${winnerByTime === "w" ? "białe" : "czarne"}.`);
        }

        return next;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [state.turn, hardGameOver, speak, timeModeOn]);

  useEffect(() => {
    if (!voiceOn) return;

    if (!initializedRef.current) {
      initializedRef.current = true;
      lastAnnouncedMoveRef.current = state.history.length;
      return;
    }

    if (state.history.length !== lastAnnouncedMoveRef.current) {
      lastAnnouncedMoveRef.current = state.history.length;

      if (state.isGameOver && state.result?.type === "checkmate") {
        speak(`Mat. Wygrywają ${state.result.winner === "w" ? "białe" : "czarne"}.`);
        return;
      }

      if (state.isGameOver && state.result?.winner === null) {
        speak("Partia zakończona remisem.");
        return;
      }

      if (state.mode === GAME_MODE.VS_COMPUTER) {
        if (state.turn === humanColor) speak("Twój ruch.");
        else speak("Ruch komputera.");
      }

      if (state.isCheck) speak("Szach.");
    }
  }, [
    state.history.length,
    state.isGameOver,
    state.result,
    state.turn,
    state.mode,
    state.isCheck,
    voiceOn,
    humanColor,
    GAME_MODE.VS_COMPUTER,
    speak,
  ]);

  useEffect(() => {
    if (state.mode !== GAME_MODE.VS_COMPUTER || !state.lastMove) return;

    if (state.history.length === lastAnimatedMoveRef.current) return;
    lastAnimatedMoveRef.current = state.history.length;

    if (state.lastMove.color !== humanColor) {
      const animation = { from: state.lastMove.from, to: state.lastMove.to, id: Date.now() };
      setAnimatedMove(animation);
      const t = window.setTimeout(() => setAnimatedMove(null), 900);
      return () => window.clearTimeout(t);
    }
  }, [state.history.length, state.lastMove, state.mode, humanColor, GAME_MODE.VS_COMPUTER]);

  function resetTimers(minutes = minutesPerSide) {
    const total = minutes * 60;
    setClock({ w: total, b: total });
    setTimeWinner(null);
  }

  function getPieceAt(square: string) {
    const { row, col } = toBoardIndex(square);
    const piece = state.board?.[row]?.[col];
    if (!piece) return null;
    return {
      symbol: currentPieceSet[`${piece.color}${piece.type}` as keyof typeof currentPieceSet] || null,
      color: piece.color as "w" | "b",
      type: piece.type,
    };
  }

  function isPromotionMove(from: string, to: string) {
    const piece = getPieceAt(from);
    if (!piece || piece.type !== "p") return false;
    const targetRank = Number(to[1]);
    return (piece.color === "w" && targetRank === 8) || (piece.color === "b" && targetRank === 1);
  }

  function handleSquareClick(square: string) {
    if (hardGameOver || pendingPromotion) return;

    if (!selectedSquare) {
      const moves = legalMovesForSquare(square);
      if (moves.length) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    const legalMoves = legalMovesForSquare(selectedSquare) as Array<{ to: string; promotion?: string }>;
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

    makeMove({ from: selectedSquare, to: matchingMove.to, promotion: matchingMove.promotion || "q" });
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
    setOrientation("w");
    setSelectedSquare(null);
    setPendingPromotion(null);
    resetTimers();
  }

  function startComputerGame() {
    newGame({ mode: GAME_MODE.VS_COMPUTER, humanColor, difficulty });
    setOrientation(humanColor);
    setSelectedSquare(null);
    setPendingPromotion(null);
    resetTimers();
  }

  function startCurrentModeGame() {
    newGame(
      state.mode === GAME_MODE.VS_COMPUTER
        ? { mode: GAME_MODE.VS_COMPUTER, humanColor, difficulty }
        : { mode: GAME_MODE.LOCAL_1V1 }
    );
    setSelectedSquare(null);
    setPendingPromotion(null);
    resetTimers();
  }

  return (
    <main className={`app-shell skin-${skin}`}>
      <section className="top-bar">
        <h1>Szachy v{APP_VERSION}</h1>
        <p>Szachy v{APP_VERSION} · PvP local / PvC AI · zegary + audio</p>
      </section>

      <section className="game-layout">
        <article className="board-panel" aria-label="Chess board panel">
          <div className="board-header">
            <span>
              {state.mode === GAME_MODE.VS_COMPUTER
                ? `AI: ${state.difficulty} · grasz ${state.humanColor === "w" ? "białymi" : "czarnymi"}`
                : "Local PvP"}
            </span>
            <span>
              {timeWinner
                ? `⏱️ Czas! Wygrane ${timeWinner === "w" ? "białe" : "czarne"}`
                : gameStatusText(state)}
            </span>
          </div>

          {timeModeOn && (
            <div className="clock-row">
              <div className={`clock-box ${state.turn === "w" && !hardGameOver ? "clock-active" : ""}`}>
                ♔ Białe: {formatClock(clock.w)}
              </div>
              <div className={`clock-box ${state.turn === "b" && !hardGameOver ? "clock-active" : ""}`}>
                ♚ Czarne: {formatClock(clock.b)}
              </div>
            </div>
          )}

          <div className="board-frame" aria-label="Chessboard container">
            <div className="board-grid" role="grid" aria-label="Chess board">
              {boardRanks.map((rank) =>
                boardFiles.map((file, fileIndex) => {
                  const coordinate = `${file}${rank}`;
                  const piece = getPieceAt(coordinate);
                  const isSelected = selectedSquare === coordinate;
                  const isTarget = legalTargets.has(coordinate);
                  const isLastMove =
                    state.lastMove && (state.lastMove.from === coordinate || state.lastMove.to === coordinate);
                  const isAnimFrom = animatedMove?.from === coordinate;
                  const isAnimTo = animatedMove?.to === coordinate;

                  return (
                    <button
                      key={coordinate}
                      type="button"
                      className={`square ${squareColor(rank, fileIndex)} ${
                        isSelected ? "selected" : ""
                      } ${isTarget ? "target" : ""} ${isLastMove ? "last-move" : ""} ${
                        isAnimFrom ? "move-anim-from" : ""
                      } ${isAnimTo ? "move-anim-to" : ""}`}
                      aria-label={`Square ${coordinate}`}
                      onClick={() => handleSquareClick(coordinate)}
                    >
                      <span className={`piece ${piece?.color === "w" ? "piece-white" : "piece-black"}`} aria-hidden>
                        {piece?.symbol}
                      </span>
                      <span className="coordinate">{coordinate}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {pendingPromotion && (
            <div className="promotion-overlay" role="dialog" aria-label="Wybór promocji pionka">
              <div className="promotion-modal">
                <span>Wybierz figurę do promocji:</span>
                <div className="promotion-row">
                  <button type="button" onClick={() => handlePromotionSelect("q")}>Hetman</button>
                  <button type="button" onClick={() => handlePromotionSelect("r")}>Wieża</button>
                  <button type="button" onClick={() => handlePromotionSelect("b")}>Goniec</button>
                  <button type="button" onClick={() => handlePromotionSelect("n")}>Skoczek</button>
                </div>
              </div>
            </div>
          )}

          {(state.isGameOver || timeWinner) && (
            <div className="celebration" role="status" aria-live="polite">
              {timeWinner ? (
                <>
                  🎉 Czas minął! Wygrywają <strong>{timeWinner === "w" ? "Białe" : "Czarne"}</strong>! ⏱️🏆
                </>
              ) : winner ? (
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
              <button type="button" onClick={startCurrentModeGame}>New Game</button>
              <button type="button" onClick={() => undoMove()}>Undo</button>
              <button type="button" onClick={() => setOrientation((v) => (v === "w" ? "b" : "w"))}>Flip Board</button>
            </div>
          </div>

          <div className="panel-card">
            <h2>Mode</h2>
            <div className="button-column">
              <label className="difficulty-label">
                AI poziom:
                <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}> 
                  <option value={DIFFICULTY.EASY}>Easy</option>
                  <option value={DIFFICULTY.MEDIUM}>Medium</option>
                  <option value={DIFFICULTY.HARD}>Hard</option>
                </select>
              </label>

              <label className="difficulty-label">
                Kolor gracza (PvC):
                <select value={humanColor} onChange={(e) => setHumanColor(e.target.value as "w" | "b")}>
                  <option value="w">Białe</option>
                  <option value="b">Czarne</option>
                </select>
              </label>

              <label className="difficulty-label">
                Skórka:
                <select value={skin} onChange={(e) => setSkin(e.target.value as "classic" | "minecraft")}>
                  <option value="classic">Klasyczna</option>
                  <option value="minecraft">Minecraft</option>
                </select>
              </label>

              <label className="difficulty-label inline-row">
                Gra na czas:
                <input
                  type="checkbox"
                  checked={timeModeOn}
                  onChange={(e) => {
                    setTimeModeOn(e.target.checked);
                    resetTimers();
                  }}
                />
              </label>

              <label className="difficulty-label">
                Minuty / gracza:
                <select
                  value={minutesPerSide}
                  onChange={(e) => {
                    const mins = Number(e.target.value);
                    setMinutesPerSide(mins);
                    resetTimers(mins);
                  }}
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                </select>
              </label>

              <button type="button" className="sound-toggle" onClick={() => setVoiceOn((v) => !v)}>
                Dźwięki i głos: {voiceOn ? "ON" : "OFF"}
              </button>

              <button type="button" onClick={startComputerGame}>Player vs Computer</button>
              <button type="button" onClick={startLocalGame}>Local Player vs Player</button>
            </div>
          </div>

          <div className="panel-card status-card">
            <h2>Zbite figury</h2>
            <ul>
              <li>
                Białe zbiły: <span className="captured-list">{captured.byWhite.join(" ") || "--"}</span>
              </li>
              <li>
                Czarne zbiły: <span className="captured-list">{captured.byBlack.join(" ") || "--"}</span>
              </li>
            </ul>
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
