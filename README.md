# CareLoop interview demo

This is a static, clickable AI product prototype for a product manager
interview. Open `index.html` in a browser to demo the flow.

## Suggested demo path

1. Start with the widget flow.
2. Explain why widget and lock-screen entry points are the core usage bet.
3. Simulate the lock-screen popup.
4. Click `Not sure`.
5. Save the uncertain medication event.
6. Go to Log and explain the event history, persistence, and treatment-path risk detection.
7. Go to Doctor and generate the mocked AI question list.
8. Go to PM and explain metrics, prioritization, AI boundary, and roadmap.

## Positioning line

CareLoop is not a complete medical app and not an AI doctor. This prototype
validates the core interaction loop: medication confirmation, uncertain status
capture, treatment-path risk signals, and AI-assisted doctor visit preparation.
The strongest product point is that the experience starts from low-friction
daily surfaces such as widgets and lock-screen notifications, not from asking
users to open a full app every day.

## AI explanation

The current demo uses mocked AI output for reliability. In a real version, the
AI layer would summarize self-recorded events into appointment questions, while
avoiding diagnosis, medication changes, dosage advice, or missed-dose medical
instructions.

The demo now stores reminder actions in `localStorage`, so confirmation,
uncertainty, and reminder-later actions remain visible after refresh in the
same browser. The `Log` screen shows recent events and calculated demo metrics.
It also includes a PWA manifest and service worker, so the deployed Vercel URL
can be added to a phone home screen for app-like personal testing.

The project also includes an optional Vercel serverless endpoint:
`api/generate-questions.js`. It can call DeepSeek or Gemini when environment
variables are configured, but the main demo remains safe if no API key is set.

See:

- `deployment-and-ai-flow.md`
- Metrics: reminder confirmation rate, uncertain event rate, doctor-prep usage,
  D7 retention, and cohort changes after enabling a second reminder.
- Roadmap: prototype first, then native notifications/widgets and analytics,
  then model-assisted summaries after safety review.
