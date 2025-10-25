# Repository Guidelines

## Project Structure & Module Organization
- `docs/` — Contributor docs. See `docs/PLUGIN_DEVELOPMENT_GUIDE.md:1` for end‑to‑end plugin details.
- `sample-plugins/hello-world-plugin/` — Reference plugin with `index.js`, `plugin.json`, and `README.md`.
- `sample-plugins/hello-world-plugin.zip` — Prebuilt distributable of the sample plugin.

## Build, Test, and Development Commands
- Validate plugin manifest: `powershell -Command "Get-Content sample-plugins/hello-world-plugin/plugin.json | ConvertFrom-Json > $null"` (fails on invalid JSON).
- Package plugin (Windows): `Compress-Archive -Path sample-plugins/hello-world-plugin/* -DestinationPath sample-plugins/hello-world-plugin.zip -Force`.
- Package plugin (Unix): `zip -r sample-plugins/hello-world-plugin.zip sample-plugins/hello-world-plugin`.
- Local run is handled by the host app; load the zip or folder into the PE Investor Portal per the development guide.

## Coding Style & Naming Conventions
- JavaScript: 2‑space indentation, semicolons, single quotes; keep components in PascalCase (e.g., `WelcomeBanner`).
- IDs and routes: kebab‑case IDs in `plugin.json` (e.g., `hello-world-plugin`), routes like `/plugins/hello-world`.
- JSON: 2‑space indent; keep stable key order: core metadata, `menus`, `widgets`, `hooks`, `settings`.
- Files: entry point `index.js`, manifest `plugin.json`; keep assets co‑located with the plugin.

## Testing Guidelines
- No repo‑level test runner. Perform manual QA in the host app:
  - Manifest loads without errors; menu entries appear.
  - Widgets mount in each declared slot and react to props.
  - Context API calls (e.g., `showSuccess`, `getPluginData`) work.
- Keep changes minimal; if adding tooling, document how to run it.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat: add QuickActionsWidget`, `fix: correct widget slot`).
- Keep subjects ≤ 72 chars; use imperative mood.
- PRs must include: summary, test notes (manual steps), screenshots/GIFs for UI, and the updated `.zip` artifact when relevant.

## Security & Configuration Tips
- Do not hardcode secrets or tokens. Avoid `eval` and remote script injection.
- Keep dependencies to a minimum; prefer the host app’s globals (e.g., `window.Vue`).
- Validate `plugin.json` fields: unique `id`, SemVer `version`, compatible `coreVersion` range, and accurate routes/slots.

