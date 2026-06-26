# CareLoop interview script: AI-powered MVP design and delivery

## 60-second opening

CareLoop is a chronic medication adherence prototype. I did not start by
building a complete medical app. I first identified the highest-frequency user
moment: a patient sees a reminder and needs to record whether they took the
medication, forgot, or are not sure.

So the MVP focuses on a low-friction loop:

Widget or lock-screen reminder -> one-tap status capture -> safe uncertainty
handling -> drop-off risk signal -> AI-generated doctor preparation questions.

The important product boundary is that CareLoop is not an AI doctor. It does
not diagnose, adjust medication, or give missed-dose advice. AI is used to
summarize self-recorded data and help the user communicate better with a
clinician.

## How AI helped me design the MVP

I used AI as a product sparring partner first, not just as a code generator.
The workflow was:

1. Clarify the user problem and reject an overly broad MVP.
2. Break the product into a single demonstrable loop.
3. Define which parts should be mocked for interview reliability.
4. Generate and iterate the clickable prototype with AI coding assistance.
5. Use the prototype to explain product strategy, model boundaries, metrics,
   and roadmap.

The biggest AI-assisted decision was scope control. Instead of building login,
database, real notifications, or a live model integration, I kept the prototype
focused on the interaction that validates the product hypothesis.

## Why widget and lock-screen entry matter

For chronic medication adherence, the hard part is not a beautiful dashboard.
The hard part is making recording easy at the exact moment the reminder appears.

That is why this demo starts from a simulated widget and lock-screen popup. The
full app exists for review and context, but the key user behavior should happen
with one tap from a daily surface.

This reflects a product judgment: reduce recording cost before adding more
features.

## How AI is embedded in the product

The AI layer has three parts:

Input:
Self-recorded events such as missed doses, uncertain events, unconfirmed
reminders, fatigue score changes, and next review date.

Guardrail:
The model is instructed not to diagnose, not to recommend dose changes, and not
to provide missed-dose medical advice.

Output:
A structured doctor preparation checklist, for example:

- I had two uncertain medication events this month. How should I handle this in
  the future?
- I missed one weekly dose. Should I record it differently or contact the clinic
  next time?
- My fatigue score increased recently. Should any follow-up tests be considered?
- Should my next review date or lab test schedule be adjusted?

For the interview demo, this output is mocked so the demonstration is stable and
safe. In a real implementation, I would call a server-side model endpoint and
return structured JSON.

## Why I would not put the API key in the frontend

The frontend should never contain a DeepSeek or Gemini API key. A production
version would use:

Frontend -> serverless function -> model provider -> structured response.

This lets us protect API keys, add safety prompts, log model failures, and
switch providers if needed.

For a DeepSeek interview context, I would position DeepSeek as the preferred
provider because it matches the company and supports OpenAI-compatible API
patterns. Since I also have Gemini Pro access, Gemini is a practical backup for
rapid prototyping. The product architecture should keep the provider replaceable.

## Metrics I would track

I would track both user behavior and AI usefulness:

- Reminder confirmation rate
- Not sure event rate
- Weekly adherence completion
- Doctor question generation rate
- D7 retention
- Second-reminder adoption
- Percentage of AI outputs accepted, edited, or dismissed

The key question is whether lower-friction entry points improve recording
behavior and whether AI doctor prep creates enough value for users to return.

## Roadmap

Prototype:
Clickable demo with widget, lock-screen simulation, uncertainty capture, risk
summary, and mocked AI doctor prep.

V1:
Native notifications, lock-screen widgets, secure local storage, event tracking,
and analytics dashboard.

V2:
Server-side DeepSeek or Gemini integration, structured output, model safety
guardrails, exportable doctor visit summary, and optional caregiver sharing.

Not in scope:
Diagnosis, dose adjustment, medication recommendation, or autonomous medical
decision-making.

## Closing line

The goal of this MVP is not to prove I can build a full medical app in one day.
It is to show how I use AI tools to move from an ambiguous user problem to a
focused, safe, clickable product loop, and how I think about AI boundaries,
metrics, and iteration.
