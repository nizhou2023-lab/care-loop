const app = document.querySelector("#app");

const STORAGE_KEY = "careloop-demo-state-v2";

const initialEvents = [
  {
    id: "evt-2026-06-20-weekly-missed",
    date: "Jun 20",
    time: "20:00",
    medication: "Weekly injection",
    status: "missed",
    source: "Reminder",
    note: "No confirmation recorded before midnight.",
  },
  {
    id: "evt-2026-06-22-daily-confirmed",
    date: "Jun 22",
    time: "08:00",
    medication: "Hydroxychloroquine",
    status: "confirmed",
    source: "Widget",
    note: "One-tap confirmation from morning widget.",
  },
  {
    id: "evt-2026-06-24-weekly-unconfirmed",
    date: "Jun 24",
    time: "20:00",
    medication: "Weekly injection",
    status: "unconfirmed",
    source: "Lock screen",
    note: "Reminder was shown but no action was taken.",
  },
  {
    id: "evt-2026-06-25-daily-confirmed",
    date: "Jun 25",
    time: "08:00",
    medication: "Hydroxychloroquine",
    status: "confirmed",
    source: "Widget",
    note: "Routine daily confirmation.",
  },
  {
    id: "evt-2026-06-26-weekly-uncertain",
    date: "Jun 26",
    time: "20:00",
    medication: "Weekly injection",
    status: "uncertain",
    source: "Lock screen",
    note: "User was not sure and saved uncertainty safely.",
  },
];

const state = {
  screen: "welcome",
  generatedQuestions: false,
  liveAiStatus: "idle",
  liveAiQuestions: [],
  liveAiProvider: "",
  liveAiError: "",
  showMedForm: false,
  noteSaved: false,
  reminderStatus: "pending",
  events: [...initialEvents],
  secondReminderEnabled: true,
};

const navItems = [
  ["entry", "Entry"],
  ["today", "Today"],
  ["log", "Log"],
  ["doctor", "Doctor"],
  ["pm", "PM"],
];

function applyInitialRoute() {
  const params = new URLSearchParams(window.location.search);
  const screen = params.get("screen");
  const flow = params.get("flow");

  if (screens[screen]) {
    state.screen = screen;
  }

  if (flow === "reminder") {
    state.screen = "lock";
  }
}

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (Array.isArray(saved.events)) state.events = saved.events;
    if (typeof saved.reminderStatus === "string") state.reminderStatus = saved.reminderStatus;
    if (typeof saved.noteSaved === "boolean") state.noteSaved = saved.noteSaved;
    if (typeof saved.generatedQuestions === "boolean") state.generatedQuestions = saved.generatedQuestions;
    if (typeof saved.secondReminderEnabled === "boolean") {
      state.secondReminderEnabled = saved.secondReminderEnabled;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function persistState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      events: state.events,
      reminderStatus: state.reminderStatus,
      noteSaved: state.noteSaved,
      generatedQuestions: state.generatedQuestions,
      secondReminderEnabled: state.secondReminderEnabled,
    }),
  );
}

function addEvent(status, note, source = "Lock screen") {
  state.events.unshift({
    id: `evt-${Date.now()}`,
    date: "Jun 26",
    time: status === "confirmed" ? "20:01" : "20:00",
    medication: "Weekly injection",
    status,
    source,
    note,
  });
  state.events = state.events.slice(0, 12);
  persistState();
}

function resetDemoData() {
  state.events = [...initialEvents];
  state.reminderStatus = "pending";
  state.noteSaved = false;
  state.generatedQuestions = false;
  state.secondReminderEnabled = true;
  persistState();
  render();
}

function getEventStats() {
  const total = state.events.length || 1;
  const count = (status) => state.events.filter((event) => event.status === status).length;
  const confirmed = count("confirmed");
  const uncertain = count("uncertain");
  const missed = count("missed");
  const unconfirmed = count("unconfirmed");
  const confirmationRate = Math.round((confirmed / total) * 100);
  const uncertaintyRate = Math.round((uncertain / total) * 100);
  const interruptions = missed + unconfirmed + uncertain;

  return {
    total,
    confirmed,
    uncertain,
    missed,
    unconfirmed,
    interruptions,
    confirmationRate,
    uncertaintyRate,
    doctorPrepRate: state.generatedQuestions ? 42 : 21,
    riskLevel: interruptions >= 3 ? "Needs attention" : "Stable",
  };
}

function setScreen(screen) {
  state.screen = screen;
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderNav(active) {
  return `
    <nav class="nav" aria-label="Primary navigation">
      ${navItems
        .map(
          ([key, label]) => `
            <button class="${active === key ? "active" : ""}" data-screen="${key}" type="button" aria-label="${label}">
              <span class="nav-mark"></span>${label}
            </button>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderShell(active, content) {
  return `
    <div class="content with-nav">${content}</div>
    ${renderNav(active)}
  `;
}

function welcome() {
  return `
    <div class="content">
      <img class="hero-visual" src="assets/careloop-visual.png" alt="Abstract care path illustration" />
      <p class="eyebrow">CareLoop</p>
      <h1>Stay on your treatment path.</h1>
      <p>
        A mobile-first AI product prototype for low-friction medication
        confirmation, uncertainty capture, adherence risk signals, and doctor
        visit preparation.
      </p>
      <div class="stack">
        <div class="soft-panel">
          <h3>Product hypothesis</h3>
          <p>
            Long-term medication users will not open an app every day. The
            product should meet them at the lock screen and widget, then turn
            interruptions into a clear care conversation.
          </p>
        </div>
        <button class="primary" data-screen="entry" type="button">Start with widget flow</button>
        <button class="ghost" data-screen="pm" type="button">View AI product logic</button>
      </div>
    </div>
  `;
}

function entry() {
  const stats = getEventStats();

  return renderShell(
    "entry",
    `
      <p class="eyebrow">Low-friction entry</p>
      <h2>Widget and lock-screen first</h2>
      <p>The core behavior happens before the user opens the app: glance, tap, confirm, or safely mark uncertainty.</p>

      <section class="widget-board">
        <div class="mini-widget wide">
          <div class="widget-top">
            <span>CareLoop</span>
            <span class="tag warning">${stats.interruptions} signals</span>
          </div>
          <strong>Weekly medication at 20:00</strong>
          <p>Next review in 18 days</p>
          <div class="progress" aria-label="Medication adherence ${stats.confirmationRate} percent"><span style="width: ${stats.confirmationRate}%"></span></div>
        </div>

        <div class="mini-widget">
          <span class="mini-label">Risk</span>
          <strong>${stats.riskLevel}</strong>
          <p>${stats.uncertain} uncertain event${stats.uncertain === 1 ? "" : "s"} this week</p>
        </div>

        <div class="mini-widget">
          <span class="mini-label">AI prep</span>
          <strong>${state.generatedQuestions ? "4 questions" : "Not generated"}</strong>
          <p>${state.generatedQuestions ? "Ready for doctor visit" : "Generate before review"}</p>
        </div>
      </section>

      <section class="card">
        <h3>Why this matters</h3>
        <p>For chronic medication adherence, the usage bottleneck is not a prettier dashboard. It is reducing the cost of recording the moment when a reminder appears.</p>
      </section>

      <button class="primary" data-screen="lock" type="button">Simulate lock-screen popup</button>
      <button class="secondary" data-screen="today" type="button">Open full app dashboard</button>
    `,
  );
}

function today() {
  const stats = getEventStats();
  const weeklyTag = state.reminderStatus === "confirmed" ? "Confirmed" : state.reminderStatus === "uncertain" ? "Uncertain" : "Pending";
  const weeklyTagClass = state.reminderStatus === "confirmed" ? "" : "warning";

  return renderShell(
    "today",
    `
      <div class="top-row">
        <div>
          <p class="eyebrow">Today</p>
          <h2>2 tasks need confirmation</h2>
        </div>
        <button class="icon-btn" data-screen="lock" type="button" aria-label="Open reminder">!</button>
      </div>

      <div class="stack">
        <section class="card">
          <div class="title-row">
            <h3>Primary entry strategy</h3>
            <span class="tag navy">Widget first</span>
          </div>
          <p>The full app is for review and context. Routine confirmation starts from widget or lock-screen actions.</p>
          <button class="secondary" data-screen="entry" type="button">View widget hub</button>
        </section>

        <section class="card">
          <div class="task-row">
            <div class="task-main">
              <span class="task-time">Morning</span>
              <span class="task-name">Hydroxychloroquine</span>
              <span class="task-detail">Daily tablet, self-recorded</span>
            </div>
            <span class="tag">Confirmed</span>
          </div>
        </section>

        <section class="card">
          <div class="task-row">
            <div class="task-main">
              <span class="task-time">20:00</span>
              <span class="task-name">Weekly injection</span>
            <span class="task-detail">Due tonight, waiting for confirmation</span>
            </div>
            <span class="tag ${weeklyTagClass}">${weeklyTag}</span>
          </div>
          <button class="primary" data-screen="lock" type="button">Review reminder</button>
        </section>

        <section class="card">
          <div class="title-row">
            <h3>Treatment path status</h3>
            <span class="tag alert">${stats.riskLevel}</span>
          </div>
          <p>Next review in 18 days. Several recent interruptions may be worth discussing with your doctor.</p>
          <div class="progress" aria-label="Medication adherence ${stats.confirmationRate} percent"><span style="width: ${stats.confirmationRate}%"></span></div>
          <div class="disclaimer">Saved locally in this browser for demo persistence.</div>
        </section>
      </div>
    `,
  );
}

function meds() {
  return renderShell(
    "meds",
    `
      <div class="title-row">
        <div>
          <p class="eyebrow">Medication plan</p>
          <h2>Current routine</h2>
        </div>
        <button class="icon-btn" data-action="toggle-form" type="button" aria-label="Add medication">+</button>
      </div>

      <div class="stack">
        <section class="card">
          <div class="title-row">
            <h3>Hydroxychloroquine</h3>
            <span class="tag">Active</span>
          </div>
          <p>Daily medication recorded for adherence tracking only.</p>
          <div class="med-meta">
            <span class="tag navy">Daily</span>
            <span class="tag navy">08:00</span>
            <span class="tag">Confirmed today</span>
          </div>
        </section>

        <section class="card">
          <div class="title-row">
            <h3>Weekly injection</h3>
            <span class="tag warning">Pending</span>
          </div>
          <p>Weekly medication reminder. Demo data only, no dosing guidance.</p>
          <div class="med-meta">
            <span class="tag navy">Weekly</span>
            <span class="tag navy">Friday 20:00</span>
            <span class="tag warning">Next tonight</span>
          </div>
        </section>

        <section class="card">
          <div class="title-row">
            <h3>Vitamin D</h3>
            <span class="tag">Planned</span>
          </div>
          <p>Every other day reminder used to demonstrate flexible schedules.</p>
          <div class="med-meta">
            <span class="tag navy">Every other day</span>
            <span class="tag navy">12:30</span>
          </div>
        </section>

        ${
          state.showMedForm
            ? `
              <section class="card">
                <h3>Add medication</h3>
                <div class="form-grid">
                  <label class="field"><span>Medication name</span><input value="Sample medication" /></label>
                  <label class="field"><span>Frequency</span><select><option>Weekly</option><option>Daily</option><option>Every other day</option></select></label>
                  <label class="field"><span>Dose</span><input value="As prescribed" /></label>
                  <label class="field"><span>Reminder time</span><input value="20:00" /></label>
                  <button class="secondary" data-action="toggle-form" type="button">Save demo medication</button>
                </div>
              </section>
            `
            : `<button class="secondary" data-action="toggle-form" type="button">Add medication</button>`
        }
      </div>
    `,
  );
}

function lock() {
  return `
    <div class="lockscreen">
      <div>
        <div class="lock-time">20:00</div>
        <div class="lock-date">Friday, June 26</div>
      </div>

      <section class="notification">
        <div class="notification-app">
          <span>CareLoop</span>
          <span>now</span>
        </div>
        <h2>Weekly medication due at 20:00.</h2>
        <p>Confirm only what you know. If you are unsure, CareLoop records uncertainty instead of giving medical advice.</p>
        <div class="lock-actions">
          <button class="primary" data-action="taken" type="button">Taken</button>
          <button class="secondary" data-action="later" type="button">Remind later</button>
          <button class="danger-soft" data-screen="uncertain" type="button">Not sure</button>
        </div>
      </section>
    </div>
  `;
}

function uncertain() {
  return renderShell(
    "today",
    `
      <button class="ghost" data-screen="lock" type="button">Back to reminder</button>
      <section class="card uncertain-banner">
        <p class="eyebrow">Uncertain medication status</p>
        <h2>This dose has been marked as uncertain.</h2>
        <p>
          To avoid duplicate dosing, do not take extra medication based only on
          this app. If this medication has strict timing requirements, contact
          your doctor or pharmacist.
        </p>
      </section>

      <div class="stack">
        <button class="secondary" data-action="check-pillbox" type="button">Check pill box</button>
        <section class="card">
          <label class="field">
            <span>Add note</span>
            <textarea>${state.noteSaved ? "I could not remember whether I completed the weekly dose." : ""}</textarea>
          </label>
        </section>
        <button class="primary" data-action="save-uncertain" type="button">Save as uncertain</button>
        ${
          state.noteSaved
            ? `<section class="soft-panel"><strong>Saved.</strong><p>This event now contributes to the risk summary and doctor prep list.</p></section>`
            : ""
        }
      </div>
    `,
  );
}

function statusTag(status) {
  if (status === "confirmed") return `<span class="tag">Confirmed</span>`;
  if (status === "uncertain") return `<span class="tag warning">Uncertain</span>`;
  if (status === "missed") return `<span class="tag alert">Missed</span>`;
  return `<span class="tag navy">Unconfirmed</span>`;
}

function log() {
  const stats = getEventStats();
  const eventRows = state.events
    .map(
      (event) => `
        <div class="event-row">
          <div class="event-date">
            <strong>${escapeHtml(event.date)}</strong>
            <span>${escapeHtml(event.time)}</span>
          </div>
          <div class="event-main">
            <div class="title-row">
              <strong>${escapeHtml(event.medication)}</strong>
              ${statusTag(event.status)}
            </div>
            <p>${escapeHtml(event.note)}</p>
            <span class="event-source">${escapeHtml(event.source)}</span>
          </div>
        </div>
      `,
    )
    .join("");

  return renderShell(
    "log",
    `
      <p class="eyebrow">Event log and risk</p>
      <h2>${stats.riskLevel === "Needs attention" ? "Possible treatment-path drop-off" : "Routine looks stable"}</h2>
      <p>Your records show several interruptions in your treatment routine. This does not diagnose your condition, but it may be useful to discuss with your doctor.</p>

      <section class="card">
        <div class="metric-grid">
          <div class="metric"><strong>${stats.missed}</strong><span>Missed dose</span></div>
          <div class="metric"><strong>${stats.unconfirmed}</strong><span>Unconfirmed</span></div>
          <div class="metric"><strong>${stats.uncertain}</strong><span>Uncertain</span></div>
        </div>
        <div class="disclaimer">Past 7 days summary generated from sample self-recorded data.</div>
      </section>

      <section class="card">
        <div class="title-row">
          <h3>Recent event log</h3>
          <span class="tag navy">${stats.total} records</span>
        </div>
        <div class="event-list">${eventRows}</div>
      </section>

      <section class="card">
        <h3>Suggested next actions</h3>
        <div class="timeline">
          <div class="timeline-item"><span class="dot">1</span><p>Enable a second reminder for weekly medication evenings.</p></div>
          <div class="timeline-item"><span class="dot">2</span><p>Prepare questions for your doctor using the recent record summary.</p></div>
          <div class="timeline-item"><span class="dot">3</span><p>Check medication supply before the next review date.</p></div>
        </div>
        <button class="primary" data-screen="doctor" type="button">Prepare doctor questions</button>
        <button class="secondary" data-action="reset-demo" type="button">Reset demo data</button>
      </section>
    `,
  );
}

function doctor() {
  const liveAiBlock =
    state.liveAiStatus === "idle"
      ? `<section class="soft-panel"><strong>Live AI optional</strong><p>On Vercel, this can call DeepSeek or Gemini through a serverless API. Locally it falls back safely.</p></section>`
      : state.liveAiStatus === "loading"
        ? `<section class="soft-panel"><strong>Generating...</strong><p>Calling the optional server-side AI endpoint.</p></section>`
        : `
          <section class="card ai-output">
            <h3>Live AI result ${state.liveAiProvider ? `(${state.liveAiProvider})` : ""}</h3>
            <ol class="question-list">
              ${state.liveAiQuestions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}
            </ol>
            <div class="disclaimer">
              ${state.liveAiError ? `Endpoint note: ${escapeHtml(state.liveAiError)}. ` : ""}
              Generated from sample self-recorded data. This is not medical advice.
            </div>
          </section>
        `;

  return renderShell(
    "doctor",
    `
      <p class="eyebrow">Doctor prep</p>
      <h2>AI question list</h2>
      <p>Mocked AI output turns self-recorded adherence events into a concise appointment checklist.</p>

      <section class="card">
        <h3>AI pipeline shown in demo</h3>
        <div class="ai-pipeline">
          <div><span>Input</span><strong>Self-recorded events</strong><p>Missed, uncertain, fatigue score, next review date.</p></div>
          <div><span>Guardrail</span><strong>Medical boundary</strong><p>No diagnosis, no dose changes, no missed-dose advice.</p></div>
          <div><span>Output</span><strong>Doctor questions</strong><p>Clear discussion prompts for the next appointment.</p></div>
        </div>
      </section>
      <button class="primary" data-action="generate-ai" type="button">Generate AI doctor question list</button>
      <button class="secondary" data-action="generate-live-ai" type="button">Try live AI endpoint</button>

      ${
        state.generatedQuestions
          ? `
            <section class="card ai-output">
              <h3>Questions to ask your doctor</h3>
              <ol class="question-list">
                <li>I had two uncertain medication events this month. How should I handle this in the future?</li>
                <li>I missed one weekly dose. Should I record it differently or contact the clinic next time?</li>
                <li>My fatigue score increased recently. Should any follow-up tests be considered?</li>
                <li>Should my next review date or lab test schedule be adjusted?</li>
              </ol>
              <div class="disclaimer">Generated from your self-recorded data. This is not medical advice.</div>
            </section>
          `
          : `<section class="soft-panel"><strong>AI boundary</strong><p>The demo uses fixed sample output, not a live model. The product concept is summarization and communication support, not diagnosis.</p></section>`
      }

      ${liveAiBlock}
    `,
  );
}

function pm() {
  const stats = getEventStats();

  return renderShell(
    "pm",
    `
      <p class="eyebrow">Product thinking</p>
      <h2>AI PM view</h2>
      <section class="card">
        <h3>Success metrics</h3>
        <div class="metric-grid pm-metrics">
          <div class="metric"><strong>${stats.confirmationRate}%</strong><span>Reminder confirmation</span></div>
          <div class="metric"><strong>${stats.uncertaintyRate}%</strong><span>Not sure events</span></div>
          <div class="metric"><strong>${stats.doctorPrepRate}%</strong><span>Doctor prep use</span></div>
          <div class="metric"><strong>D7</strong><span>Retention cohort</span></div>
        </div>
        <div class="disclaimer">Metrics are calculated from local demo events and mock cohort assumptions.</div>
      </section>

      <section class="card">
        <h3>Prioritization logic</h3>
        <div class="timeline">
          <div class="timeline-item"><span class="dot">1</span><p>Prototype validates the core loop: widget reminder, one-tap recording, uncertainty capture, risk signal, AI doctor prep.</p></div>
          <div class="timeline-item"><span class="dot">2</span><p>V1 ships native notifications, lock-screen widgets, secure local storage, and event analytics.</p></div>
          <div class="timeline-item"><span class="dot">3</span><p>V2 adds model-assisted summaries, caregiver sharing, and clinic-facing export after safety review.</p></div>
        </div>
      </section>

      <section class="card">
        <h3>AI boundary</h3>
        <p>CareLoop does not diagnose, change medication, or provide missed-dose medical advice. AI is used for summarization, pattern surfacing, and doctor communication preparation.</p>
      </section>

      <section class="card">
        <h3>Data instrumentation</h3>
        <div class="timeline">
          <div class="timeline-item"><span class="dot">A</span><p>Log every reminder action with source: widget, lock screen, or full app.</p></div>
          <div class="timeline-item"><span class="dot">B</span><p>Compare confirmation rate before and after enabling second reminders.</p></div>
          <div class="timeline-item"><span class="dot">C</span><p>Measure whether AI doctor prep increases repeat usage before review dates.</p></div>
        </div>
      </section>

      <button class="primary" data-screen="entry" type="button">Replay core flow</button>
      <button class="secondary" data-screen="doctor" type="button">Show AI output</button>
      <button class="ghost" data-screen="log" type="button">Review event log</button>
    `,
  );
}

function profile() {
  return renderShell(
    "pm",
    `
      <p class="eyebrow">Profile</p>
      <h2>Demo user</h2>
      <section class="card">
        <h3>Care preferences</h3>
        <p>Sample data only. No real patient information is stored in this prototype.</p>
        <div class="stack">
          <div class="metric-row"><span>Second reminder</span><span class="tag">Enabled</span></div>
          <div class="metric-row"><span>Review countdown</span><span class="tag navy">18 days</span></div>
          <div class="metric-row"><span>AI doctor prep</span><span class="tag">Mocked</span></div>
        </div>
      </section>
    `,
  );
}

const screens = {
  welcome,
  entry,
  today,
  meds,
  lock,
  uncertain,
  log,
  doctor,
  pm,
  profile,
};

function render() {
  app.innerHTML = screens[state.screen]();
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  const screen = target.dataset.screen;
  const action = target.dataset.action;

  if (screen) {
    setScreen(screen);
    return;
  }

  if (action === "toggle-form") {
    state.showMedForm = !state.showMedForm;
  }

  if (action === "taken") {
    state.reminderStatus = "confirmed";
    addEvent("confirmed", "Confirmed from simulated lock-screen popup.", "Lock screen");
    setScreen("today");
    return;
  }

  if (action === "later") {
    state.reminderStatus = "pending";
    addEvent("unconfirmed", "User chose remind later; confirmation still pending.", "Lock screen");
    setScreen("today");
    return;
  }

  if (action === "save-uncertain" || action === "check-pillbox") {
    state.reminderStatus = "uncertain";
    state.noteSaved = true;
    addEvent(
      "uncertain",
      action === "check-pillbox"
        ? "User checked the pill box and still needed to record uncertainty."
        : "User saved uncertain status to avoid duplicate dosing.",
      "Lock screen",
    );
  }

  if (action === "generate-ai") {
    state.generatedQuestions = true;
    persistState();
  }

  if (action === "generate-live-ai") {
    generateLiveAi();
    return;
  }

  if (action === "reset-demo") {
    resetDemoData();
    return;
  }

  render();
});

async function generateLiveAi() {
  state.liveAiStatus = "loading";
  render();

  try {
    const response = await fetch("/api/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        record: {
          window: "past 30 days",
          uncertainEvents: 2,
          missedWeeklyDoses: 1,
          unconfirmedDoses: 2,
          fatigueTrend: "increased recently",
          nextReviewInDays: 18,
        },
      }),
    });
    const data = await response.json();
    state.liveAiStatus = "done";
    state.liveAiProvider = data.provider || "serverless";
    state.liveAiQuestions = data.questions || [];
    state.liveAiError = data.fallback ? data.error || "not configured" : "";
  } catch (error) {
    state.liveAiStatus = "done";
    state.liveAiProvider = "local fallback";
    state.liveAiError = "serverless endpoint unavailable in local static preview";
    state.liveAiQuestions = [
      "I had two uncertain medication events this month. How should I handle this in the future?",
      "I missed one weekly dose. Should I record it differently or contact the clinic next time?",
      "My fatigue score increased recently. Should any follow-up tests be considered?",
      "Should my next review date or lab test schedule be adjusted?",
    ];
  }

  render();
}

loadSavedState();
applyInitialRoute();
render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {
      // The prototype still works if the installable-app layer is unavailable.
    });
  });
}
