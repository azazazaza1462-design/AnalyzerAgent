# Analyzers Frontend

React 19 + TypeScript SPA built with Vite. Companion UI for the Analyzers Web API in `../src/Lendlogic.AnalyzersApi`.

Phase 2 deliverable: scaffold with shell layout (sidebar + header), theme toggle (light/dark), feature-slice folder structure mirroring `LendLogic.RulesEngine`. No real features yet — Jobs UI lands in Phase 5.

## Stack

| Layer | Library |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router 7 |
| Server state | React Query 5 |
| Client state | Zustand 5 |
| Styling | Tailwind 4 + shadcn-style primitives (Radix) |
| HTTP | Axios (Phase 3) |
| Auth | MSAL Entra ID (Phase 3) |
| Tests | Vitest + React Testing Library + MSW |
| API client | OpenAPI auto-generated (`@hey-api/openapi-ts`) |

## Folder structure

```
frontend/src/
├── main.tsx
├── app.css
├── app/
│   ├── App.tsx                     # providers + RouterProvider
│   └── routes.tsx                  # createBrowserRouter
├── components/
│   ├── ErrorBoundary.tsx
│   ├── layout/{AppLayout,AppSidebar}.tsx
│   └── ui/                         # shadcn-style primitives
├── features/                       # feature slices (filled Phase 5+)
├── hooks/
├── lib/utils.ts                    # cn helper
├── services/                       # axios + generated client (Phase 3-4)
├── stores/                         # zustand (Phase 3)
├── test/setup.ts
├── theme/ThemeContext.tsx          # light/dark
└── types/
```

## Scripts

```bash
npm install
npm run dev           # http://localhost:5173, proxies /api → http://localhost:5049
npm run build         # tsc + vite build
npm run lint
npm run format
npm run test
npm run generate-api  # regenerates services/generated from backend Swagger
```

## Backend prerequisites

The dev server proxies `/api/*` to `http://localhost:5049`. Have the backend running locally:

```bash
docker-compose up -d postgres
dotnet run --project ../src/Lendlogic.AnalyzersApi
```

## Environment variables

Copy `.env.example` → `.env` and fill in:
- `VITE_API_BASE_URL` — defaults to `/api/v1` (uses the dev proxy).
- `VITE_ENTRA_*` — filled in Phase 3 when auth lands.
