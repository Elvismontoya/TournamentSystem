# TournamentSystem (frontend)

Web app to organize tournaments (multi-sport; the examples are table tennis). React + Vite +
Tailwind.

It has no tournament rules of its own: players, groups, results, standings and brackets come
from the API, a separate project: **TournamentSystem-backend**. The app shows what the API
returns and sends it the organizer's actions.

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

The backend has to be running (by default on `http://localhost:3000`). If it isn't, the
tournament screen says so and offers to retry.

## Configuration

| Variable           | When          | Default                 | What                                       |
| ------------------ | ------------- | ----------------------- | ------------------------------------------ |
| `VITE_API_URL`     | Build (prod)  | `/api`                  | Base URL of the API, e.g. `https://…/api`. |
| `API_PROXY_TARGET` | `npm run dev` | `http://localhost:3000` | Where Vite forwards `/api` in development. |

Copy `.env.example` to `.env` to change them. In production the backend must allow the
frontend's domain (its `CORS_ORIGINS`).

## Structure

| Folder                     | What                                                                        |
| -------------------------- | --------------------------------------------------------------------------- |
| `src/api/`                 | API client: contract types (`types.ts`), HTTP (`client.ts`), endpoints.     |
| `src/features/tournament/` | `useTournament`: loads the tournament and exposes its actions to the pages. |
| `src/features/groupStage/` | Group screens' components (editor, filters, tie panel) and display helpers. |
| `src/features/knockout/`   | Bracket views and the manual bracket editor.                                |
| `src/pages/`               | Screens.                                                                    |

`src/api/types.ts` copies the shapes the backend returns. When the API changes, update it.

## Scripts

| Script            | Does                           |
| ----------------- | ------------------------------ |
| `npm run dev`     | Development server.            |
| `npm run build`   | Type-check and build (`dist`). |
| `npm run preview` | Serves the build.              |
| `npm run lint`    | ESLint.                        |
| `npm run format`  | Prettier.                      |

## Deployment

Vercel: build `npm run build`, output `dist`, and the `VITE_API_URL` variable pointing at the
backend (e.g. `https://<backend>.up.railway.app/api`).
