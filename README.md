# prolabs-szachy-web

Webowa gra w szachy (desktop-first, mobile-friendly).

## MVP scope

- człowiek vs komputer
- człowiek vs człowiek lokalnie (na jednym urządzeniu)
- bez logowania
- bez multiplayer online

> Na tym etapie repo zawiera **shell aplikacji i UI**, bez zaawansowanej logiki silnika szachowego.

## Tech stack

- Next.js (App Router)
- TypeScript
- CSS (custom theme, classic English chess club style)

## Quickstart

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

Open: http://localhost:3000

### 3) Build production bundle

```bash
npm run build
npm run start
```

## NPM scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint checks
- `npm run typecheck` — TypeScript type checks (no emit)

## Current UI included

- base application layout
- responsive chess board container (8×8 shell)
- controls panel shell (new game / mode / status)
- desktop-first composition with mobile-friendly fallback

## Next suggested steps

- integrate chess state model (FEN, legal moves)
- add move handling + highlights + captured pieces
- connect AI engine for player-vs-computer mode
- persist settings (board orientation, theme, difficulty)
