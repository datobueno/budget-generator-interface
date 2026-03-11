# Contributing

Thanks for contributing.

By submitting code to this repository, you agree that your contribution will be distributed under `AGPL-3.0-or-later`.

## Setup
```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm run dev
```

If you want to use the optional Google integrations, follow [docs/google-setup.md](docs/google-setup.md).

## Branch and PR Expectations
- Keep pull requests focused.
- Prefer one concern per PR.
- Include screenshots or short recordings for visible UI changes.
- Run:
  - `pnpm run doctor`
  - `pnpm run test`
  - `pnpm run build`

## Architecture Rules
- Do not add new business logic to `src/App.tsx`.
- Put domain types and pure logic in `src/entities/*`.
- Put workflows and integrations in `src/features/*`.
- Keep shadcn/ui generated components in `src/components/ui`.
- Add or update tests for pure logic changes.

## Coding Guidelines
- Use TypeScript strictly.
- Prefer deterministic, minimal changes.
- Reuse existing shadcn/ui components instead of hand-rolling alternatives.
- Keep public module entrypoints (`index.ts`) updated when adding exports.
- Never commit `.env.local`, API keys, OAuth client secrets, refresh tokens, or service-account credentials.

## Integrations
- Google integrations are optional and use contributor-owned credentials.
- Keep [`.env.example`](.env.example) and [docs/google-setup.md](docs/google-setup.md) up to date when changing Google setup requirements.
- Treat every `VITE_*` variable as public browser configuration, not as a secret.

## Reporting Issues
Use the issue templates for bugs and feature requests. Include reproduction steps and screenshots when relevant.

Security issues should follow [SECURITY.md](SECURITY.md), not public issues.

## Naming and Branding
- The product and repository are named `budget-generator-interface`.
- `datobueno` is the maintaining association, not the product name.
- If you publish a fork or hosted version, do not present it as an official `datobueno` service unless you have permission.
