# Prolabs Szachy Web — Iteracja 2026-03-03

## Cel iteracji
Dowieźć grywalne MVP w jednym wątku:
- działające przyciski sterowania,
- tryb Player vs Player (lokalnie, ta sama przeglądarka),
- tryb Player vs Computer z 3 poziomami trudności,
- widoczne figury + pełna legalność ruchów wg zasad szachowych,
- zakończenie partii z komunikatem gratulacyjnym.

## Zrobione
- Przepisanie warstwy logiki gry na TypeScript (`src/core/chessGame.ts`):
  - pełna walidacja ruchów przez `chess.js`,
  - legal moves dla każdego pola,
  - check/checkmate/draw/stalemate/insufficient material,
  - historia ruchów i last move,
  - `undoMove()` (w PvC cofa parę ruchów),
  - AI difficulty: `easy`, `medium`, `hard`.
- AI:
  - easy: ruchy losowe z preferencją taktyczną,
  - medium/hard: minimax (depth 2/3) + alpha-beta.
- Hook React (`src/react/useChessGame.ts`) z API dla UI.
- UI (`app/page.tsx`):
  - render figur Unicode na planszy,
  - wybór figur, podświetlenie możliwych ruchów,
  - last move highlight,
  - działające przyciski: New Game, Undo, Flip Board,
  - przełączanie trybów,
  - wybór poziomu AI na starcie,
  - komunikat zwycięstwa/remisu z gratulacjami.
- Styling (`app/globals.css`) pod grywalny board state.
- Deploy produkcyjny po zmianach: `https://prolabs-szachy-web.vercel.app`.

## Dodatkowo dowiezione po tej iteracji
- Wybór koloru gracza przy starcie PvC (white/black).
- Promocja pionka z wyborem figury (Q/R/B/N) przez modal w UI.
- Powiadomienia głosowe (speech synthesis) z przełącznikiem ON/OFF.
- Zegary dla obu graczy (domyślnie 10:00 na stronę).
- Panel zbitych figur (osobno: białe zbiły / czarne zbiły).
- Podniesiony kontrast pól, markerów i obrysów opcji.
- Powiększone figury/pionki (wizualnie ~80% pola).
- Dynamiczny nagłówek `Szachy v<wersja>` na bazie `src/config/version.ts`.

## Plan domknięcia (następny krok)
1. Dodać SAN move list (pełny zapis partii z numeracją ruchów).
2. Dodać smoke e2e (min. start game, legal move, checkmate flow, promotion flow).
3. Persist ustawień (orientacja, poziom AI, kolor gracza, audio ON/OFF).
4. Upgrade Next.js do wersji bez znanego CVE.
