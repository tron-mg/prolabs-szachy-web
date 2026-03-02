const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

function squareColor(rank: number, fileIndex: number) {
  return (rank + fileIndex) % 2 === 0 ? "square-light" : "square-dark";
}

export default function Home() {
  return (
    <main className="app-shell">
      <section className="top-bar">
        <h1>Prolabs Chess</h1>
        <p>MVP interface shell · Desktop-first · Mobile-friendly</p>
      </section>

      <section className="game-layout">
        <article className="board-panel" aria-label="Chess board panel">
          <div className="board-header">
            <span>Classic Board</span>
            <span>White to move</span>
          </div>

          <div className="board-frame" aria-label="Chessboard container">
            <div className="board-grid" role="grid" aria-label="Chess board">
              {ranks.map((rank) =>
                files.map((file, fileIndex) => {
                  const coordinate = `${file}${rank}`;
                  return (
                    <button
                      key={coordinate}
                      type="button"
                      className={`square ${squareColor(rank, fileIndex)}`}
                      aria-label={`Square ${coordinate}`}
                    >
                      <span className="coordinate">{coordinate}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </article>

        <aside className="controls-panel" aria-label="Game controls">
          <div className="panel-card">
            <h2>Match Controls</h2>
            <div className="button-row">
              <button type="button">New Game</button>
              <button type="button">Undo</button>
              <button type="button">Flip Board</button>
            </div>
          </div>

          <div className="panel-card">
            <h2>Mode</h2>
            <div className="button-column">
              <button type="button">Player vs Computer</button>
              <button type="button">Local Player vs Player</button>
            </div>
          </div>

          <div className="panel-card status-card">
            <h2>Game Status</h2>
            <ul>
              <li>Turn: White</li>
              <li>Clock: --:--</li>
              <li>Last move: --</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}
