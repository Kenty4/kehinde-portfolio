# AI Business Operator — App

This is a runnable MVP based directly on the uploaded **AI Business Operator — Manager Loop** workflow.

## What it turns into

The app provides:
- Manager dashboard
- Business objective
- Cycle runner
- AI manager planning
- Web research
- Prospect qualification with 0–100 scores
- AI outreach drafts
- Human approval gate
- Cycle history
- Local JSON persistence
- Demo mode when API keys are not configured

The original workflow explicitly schedules a daily manager cycle, checks for an open cycle, plans with Claude, researches prospects, qualifies them, drafts Gmail outreach, notifies for approval, and pauses at the approval boundary. The app preserves that core flow.

## Run it

1. Install Node.js 18+.
2. Open a terminal in this folder.
3. Run:

```bash
npm install
npm start
```

4. Open `http://localhost:3000`.

## Enable real AI + search

Copy `.env.example` to `.env` and add:

- `ANTHROPIC_API_KEY`
- `GOOGLE_SEARCH_API_KEY`
- `GOOGLE_SEARCH_CX`

You can leave them blank to use demo mode.

## Important

This MVP intentionally does **not** automatically send emails. It stops at approval, matching the safety/approval boundary in the source workflow. Gmail and Slack can be added as production connectors later.

## Production upgrade path

- PostgreSQL instead of `data.json`
- User authentication
- Background job queue / daily scheduler
- Gmail OAuth for draft creation
- Slack approval actions
- Real CRM integration
- Agent-specific delivery workflows
- Revenue and analytics tracking
- Cloud deployment
