# Analyzers Frontend

React 19 + TypeScript SPA built with Vite. Companion UI for the Analyzers Web API in `../src/Lendlogic.AnalyzersApi`.

Renders a Jobs list (filters, pagination) and detail page (`/jobs`, `/jobs/:id`) backed by the user-facing endpoints in the API.

## Stack

| Layer | Library |
|---|---|
| Framework | React 19 + Vite |
| Routing | React Router 7 |
| Server state | React Query 5 |
| Client state | Zustand 5 |
| Styling | Tailwind 4 + shadcn-style primitives (Radix) |
| HTTP | Axios (with 401 → refresh interceptor) |
| Auth | Stub login (localStorage) — MSAL Entra ID is queued for re-enablement |
| Tests | Vitest + React Testing Library |
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
│   ├── layout/{AppLayout,AppSidebar,protected-route}.tsx
│   └── ui/                         # shadcn-style primitives
├── features/
│   ├── auth/LoginPage.tsx
│   └── jobs/                       # list + detail + api + hooks + components
├── hooks/use-mobile.ts
├── lib/{utils,query-keys}.ts
├── services/{api,tokenRefresh}.ts + generated/   # OpenAPI client
├── stores/auth-store.ts
├── test/setup.ts
└── theme/ThemeContext.tsx          # light/dark
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

## Local setup (full end-to-end)

```bash
# 1. Start Postgres
docker-compose up -d postgres

# 2. Start the backend (auto-applies EF migrations on boot).
#    The first run also needs the seed data below.
dotnet run --project ../src/Lendlogic.AnalyzersApi

# 3. (One-time, while backend is up) Seed the demo Caller and Jobs.
#    Run from the repo root:
psql -h localhost -p 5432 -U lendlogic -d analyzers_dev -f sql/seed/00-callers.sql
psql -h localhost -p 5432 -U lendlogic -d analyzers_dev -f sql/seed/01-jobs.sql

# 4. Start the frontend
npm run dev
```

Open <http://localhost:5173>, sign in with any email (stub auth), and you should see 6 demo jobs in the list.

> **Auth note**: while MSAL Entra ID is being re-enabled, the read endpoints
> (`GET /jobs`, `GET /jobs/:id`) accept anonymous requests **only when the
> backend runs in Development**. Staging/production keep the auth requirement.

## Environment variables

Copy `.env.example` → `.env` and fill in:
- `VITE_API_BASE_URL` — API origin. Leave empty in dev (the Vite proxy forwards `/api/*`); set to the API App Service origin in QA/prod.
- `VITE_ENTRA_CLIENT_ID` — required for sign-in (App Registration client ID). `VITE_ENTRA_TENANT_ID` / `VITE_ENTRA_REDIRECT_URI` are optional (default to the Viewnear tenant and the page origin).
- `VITE_DISABLE_MSW` — reserved for future MSW use, not active today.
