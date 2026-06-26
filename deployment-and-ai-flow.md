# CareLoop AI coding and deployment flow

## Recommended toolchain

Use this stack for the interview version:

- AI coding: Codex for fast local iteration; Cursor or VS Code for long-term maintenance.
- Version control: Git + GitHub.
- Deployment: Vercel.
- AI provider: mock by default; optional serverless provider switch between DeepSeek and Gemini.

## Why the local preview URL is not enough

`http://127.0.0.1:4173/` only works on this computer. It is good for rehearsal,
but it cannot be sent to interviewers or opened on another machine.

For a public demo URL, deploy this folder to Vercel.

## Fastest deployment path

Use Vercel Drop if the CLI is slow or you do not want to log in through terminal:

1. Go to `https://vercel.com/new`.
2. Choose the drag-and-drop/static project flow.
3. Upload the `D:\care loop` folder.
4. Vercel will serve `index.html` as the main page.

This project already includes:

- `package.json`
- `vercel.json`
- `.gitignore`
- optional `api/generate-questions.js`

## GitHub + Vercel path

After Git is available in your terminal:

```powershell
git init
git add .
git commit -m "Build CareLoop AI product demo"
```

Then create a GitHub repo and push it. Import the repo in Vercel.

## Optional live AI setup

The demo is stable without live AI. The live AI button calls:

```text
/api/generate-questions
```

On Vercel, configure environment variables.

DeepSeek option:

```text
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=your_key
DEEPSEEK_MODEL=deepseek-chat
```

Gemini option:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-1.5-pro
```

Do not put API keys in `app.js` or any frontend file.

## Recommended interview stance

Use mock AI for the live interview path. Keep the live endpoint as architecture
proof and a bonus if the environment is configured.

Say:

> The prototype defaults to mock AI for reliability and medical safety. The
> deployable architecture uses a serverless endpoint so the API key stays off
> the client, and the provider can be switched between DeepSeek and Gemini.

## Current best next steps

1. Rehearse with the local preview.
2. Push the project to GitHub.
3. Import the GitHub repository into Vercel so redeploys happen automatically.
4. Add Vercel environment variables only if you want the optional live AI path.
5. Keep the main interview narrative focused on product judgment, not API tricks.

## What changed after the first deploy

The demo now has a more complete MVP data loop:

- Reminder actions are persisted in browser `localStorage`.
- The `Log` screen shows recent confirmed, missed, unconfirmed, and uncertain events.
- The `PM` screen calculates demo metrics from local events.
- Refreshing the page keeps the demo event history in the same browser.

If you deployed with Vercel Drop, upload the folder again to publish these
changes. If you deploy from GitHub, commit and push the changes, then Vercel
will redeploy automatically.
