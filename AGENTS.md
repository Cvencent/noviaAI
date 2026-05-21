# Repository Instructions

## Shape of the repo
- This is not an npm workspace: `client/` and `server/` are independent npm projects with separate `package.json` files; run commands from the app directory you are changing.
- `client/` is a React 18 + Vite + TypeScript SPA. Routes live in `client/src/App.tsx`; API modules live in `client/src/api/`; `@/*` resolves to `client/src/*`.
- `server/` is a NestJS API. `server/src/main.ts` sets the global API prefix to `/api/v1`, enables CORS, and listens on port `4000`.
- Nest modules are wired only when imported in `server/src/app.module.ts`; do not assume a folder under `server/src/modules/` is active.
- `demo/` is a separate Java/IntelliJ project and is unrelated to the main React/Nest app.

## Commands
- Client: `cd client && npm run dev` starts Vite on port `3000`; `cd client && npm run build` runs `tsc && vite build`; `cd client && npm run preview` previews the build.
- Server: `cd server && npm run start:dev` starts Nest watch mode. The README mentions `npm run dev`, but `server/package.json` defines `start:dev`, not `dev`.
- Server verification: `cd server && npm run build`, `cd server && npm run lint`, `cd server && npm run test`, `cd server && npm run test:cov`.
- Focused server test: Jest is configured in `server/package.json` with `rootDir: "src"` and `*.spec.ts`; use `cd server && npm run test -- path/or/name.spec.ts` or Jest flags after `--`.
- Prisma: `cd server && npm run prisma:migrate` is `prisma migrate dev`; `npm run prisma:migrate:deploy` is deploy; `npm run prisma:generate` regenerates the client.
- Docker: from repo root, `docker-compose up -d`, `docker-compose up --build`, `docker-compose logs -f`, and `docker-compose down` are documented workflows.

## Runtime and env gotchas
- The client Axios base URL defaults to `http://localhost:4000/api/v1` in `client/src/api/client.ts`; Vite dev also proxies `/api` to `http://localhost:4000`.
- `docker-compose.yml` sets `VITE_API_BASE_URL=http://localhost:3000/api` for the client container, while the server itself prefixes routes with `/api/v1`; check this before changing production API paths.
- `server/prisma/schema.prisma` currently uses `provider = "sqlite"`, but root `.env.example`, `server/prisma/.env.example`, and `docker-compose.yml` describe PostgreSQL. Verify the intended DB target before migration or Docker work.
- Root `.env.example` contains Docker-level DB/JWT/AI-provider values; `server/prisma/.env.example` contains Prisma `DATABASE_URL` and JWT values for local server work.

## Patterns to follow
- Server feature work usually follows `server/src/modules/<feature>/<feature>.module.ts`, `.controller.ts`, `.service.ts`, and `dto/`; register new modules in `AppModule` or they will not run.
- Prisma schema changes require matching migrations and a Prisma client regenerate before relying on new types.
- Client auth state is in `client/src/store/auth.ts`; `client/src/api/client.ts` injects the JWT and redirects 401 responses to `/login`.
- React Query defaults are centralized in `client/src/App.tsx`; avoid creating competing query clients.

## Do not edit generated/runtime artifacts
- Do not hand-edit `client/dist/`, `server/dist/`, `server/node_modules/.prisma/`, or local SQLite files such as `server/prisma/dev.db`.
