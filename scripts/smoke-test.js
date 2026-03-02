import { ChessGame, GAME_MODE } from '../src/core/chessGame.js';

const localGame = new ChessGame({ mode: GAME_MODE.LOCAL_1V1 });
console.log('local start', localGame.getState().turn === 'w');
console.log('local move e2e4', localGame.makeMove('e2e4').ok);

const vsAi = new ChessGame({ mode: GAME_MODE.VS_COMPUTER, humanColor: 'w' });
const afterHuman = vsAi.makeMove('e2e4');
console.log('vs ai human move ok', afterHuman.ok);
console.log('vs ai computer responded', Boolean(afterHuman.computerMove));
console.log('history length >= 2', vsAi.getState().history.length >= 2);
