# CareLoop

CareLoop is a static, clickable product demo for medication adherence support.
It shows a mobile-first flow for medication planning, daily recording,
lock-screen reminders, history tracking, and AI-monitored risk alerts.

CareLoop is not a medical advisor. It does not diagnose, change medication,
recommend dosage, or provide missed-dose instructions.

## Demo Flow

1. Open Home to view the adherence entry points.
2. Open Plan to add a medication with name, dose note, frequency, reminder time,
   and reminder behavior.
3. Open Today and record a medication as Taken. The button changes to Recorded
   and cannot be clicked repeatedly.
4. Open Risk to view the AI-monitored risk alert concept.
5. Preview the lock-screen reminder. Each pending medication has one Taken
   button. The reminder stays until all due medications are recorded.
6. Open History to view persisted local records and the late-record rule.
7. Use Archive to remove a medication from the active plan while keeping its
   history. Use Delete to fully remove an archived medication and its records.

## AI Scope

The current demo does not call a live AI model. The Risk page shows where AI
would be embedded in a production version.

Future AI behavior:

- Monitor behavior signals such as missing records, repeated late records, and
  delayed check-ins.
- Estimate whether the user may be at risk of medication routine drop-off.
- Raise `Missing record risk` to `High` only when behavior data indicates risk.
- Suggest operational actions such as setting an alarm or keeping a lock-screen
  reminder active.
- Stay inside the safety boundary: no diagnosis, no dose changes, and no medical
  treatment advice.

In this demo, the Risk page uses deterministic frontend logic and sample data so
the flow remains stable.

## Data and Deployment

The demo stores medication plans and records in `localStorage`, so data persists
after refresh in the same browser. It includes a PWA manifest and service worker,
so the deployed URL can be added to a phone home screen for app-like testing.

This version does not require any API key or serverless function.
