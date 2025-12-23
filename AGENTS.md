# Repository Guidelines

## Project Structure & Module Organization
- `index.html` and `index.tsx` are the Vite entry points.
- `App.tsx` holds the main UI flow and routes between ritual states.
- `components/` contains React UI blocks (PascalCase filenames like `Layout.tsx`).
- `services/` contains API and side-effect logic (e.g., `hyperliquidService.ts`).
- Shared logic lives in `store.ts` (Zustand), `types.ts`, `constants.ts`, and `utils.ts`.
- Static metadata is stored in `metadata.json`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start the Vite dev server for local development.
- `npm run build`: create a production build in `dist/`.
- `npm run preview`: serve the production build locally for verification.

## Coding Style & Naming Conventions
- TypeScript + React with functional components and hooks.
- Indentation is 2 spaces; keep JSX readable with multiline props.
- Component files use PascalCase (`ResultView.tsx`); utilities and services use camelCase with suffixes like `Service` (e.g., `priceService.ts`).
- Prefer explicit types in shared modules (`types.ts`) and keep constants centralized in `constants.ts`.

## Testing Guidelines
- There is currently no test framework or test directory in this repository.
- If you add tests, keep them close to the source (e.g., `components/__tests__/`) and document the runner and command in this file.

## Commit & Pull Request Guidelines
- Recent commits follow Conventional Commits style (e.g., `feat: ...`).
- Keep commit messages short and scoped to a single change.
- PRs should include a clear description, key screenshots for UI changes, and any relevant issue links.

## Configuration & Secrets
- Optional local config goes in `.env.local`. Example: `GEMINI_API_KEY=...` (not required by default).
- Do not commit secrets; verify `.env.local` stays untracked.
