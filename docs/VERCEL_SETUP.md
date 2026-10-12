# Vercel agent setup and project deployment

Followed the user-requested [official onboarding playbook](https://vercel.com/get-started.md) on 12 October 2026.

## Verified machine / agent state

- Global CLI upgraded from 54.18.1 to **63.1.2**.
- CLI login completed and `vercel whoami` verified account **rjss2829singh-9495**.
- Official **vercel@openai-curated** plugin installed for **Codex, user scope**, using `npx plugins add vercel/vercel-plugin --target codex --scope user --yes`.
- Standalone skill pack was not additionally installed.
- Shared **https://mcp.vercel.com** registration added using the Codex MCP command; OAuth completed successfully.
- `codex mcp list` reports the `vercel` server enabled with OAuth.
- User configuration: `~/.codex/config.toml`; unrelated settings preserved.
- **New plugin tools/commands require a session reload to become discoverable.** The current conversation does not expose the new Vercel MCP tools, so `search_vercel_documentation` / authenticated `list_teams` were not called. Registration/OAuth is verified; an MCP tool invocation is not claimed.
- Existing authenticated CLI access was used to finish project deployment independently.

## Project configuration

- Vercel project: **jalrakshak-ai**.
- Project owner: **rjss2829singh-9495's projects**.
- Project settings linked locally in the ignored `.vercel/` directory.
- Vite production build: `npm run build`; output: `dist/`.
- Framework, build command and output are declared in `vercel.json`.
- Hash routes work on refresh without server rewrites.
- `.vercelignore` excludes original datasets, local Python environment, scripts, tests and local secrets from deployment uploads.
- Linking created a local ignored `.env.local` with a Vercel OIDC token. It is not committed and no `VITE_` credential is used.

## Confirmed first production deployment

- Public production alias: **https://jalrakshak-ai-opal.vercel.app**.
- Deployment: `dpl_9YZB8fnmKzC2ZdVRLPkbgPFXN3J8`.
- Deployment URL: https://jalrakshak-klko6e7gj-rjss2829singh-9495s-projects.vercel.app.
- Target: **production**.
- CLI terminal status: **READY**.

The deployment URL may have Vercel account protection; use the production alias for hackathon sharing. Its home page and JSON returned HTTP 200 without login, and all ten Chrome desktop/mobile tests passed against the public alias. Details are recorded in `docs/TESTING.md`.

The GitHub repository **https://github.com/rajsingh1301/JalRakshakAI** is connected to Vercel (`vercel git connect` returned **Connected**). Future pushes trigger Vercel deployments. The separate GitHub Actions workflow validates data, builds and browser behavior; Vercel’s default Git deployment is not a promise that it waits for this workflow.

## Repeat deployment

```sh
npm test
.venv/bin/python -m unittest discover -s tests -p 'test_*.py'
npm run build
vercel deploy --prod --yes
```

No secret token is stored in the repository. Machine-scoped login and optional plugin access are separate from the frontend, which does not need credentials from website visitors.
