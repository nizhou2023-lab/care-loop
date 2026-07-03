const STORAGE_KEY = "careloop-demo-state-v6";
const todayLabel = "Jun 26";

const seedMeds = [
  {
    id: "med-bp",
    name: "Blood pressure medication",
    dose: "1 tablet after breakfast",
    frequency: "daily",
    reminderDay: "Every day",
    reminderTime: "08:00",
    status: "active",
    createdAt: "2026-06-20T09:00:00.000Z"
  },
  {
    id: "med-weekly",
    name: "Weekly injection",
    dose: "As prescribed",
    frequency: "weekly",
    reminderDay: "Friday",
    reminderTime: "20:00",
    status: "active",
    createdAt: "2026-06-20T09:05:00.000Z"
  }
];

const seedEvents = [
  {
    id: "event-1",
    medId: "med-bp",
    medName: "Blood pressure medication",
    date: "Jun 25",
    time: "08:10",
    status: "confirmed",
    source: "today",
    note: "Recorded from Today."
  },
  {
    id: "event-2",
    medId: "med-weekly",
    medName: "Weekly injection",
    date: "Jun 19",
    time: "21:08",
    status: "late",
    source: "lock-screen",
    note: "Recorded more than 1 hour late. Counted as a late record."
  }
];

const defaultState = {
  screen: "entry",
  meds: seedMeds,
  events: seedEvents,
  showMedForm: false,
  editingMedId: null,
  activeReminderMedId: "med-bp",
  reminderEnabled: true,
  lockSnoozed: false
};

const navItems = [
  { id: "entry", label: "Home" },
  { id: "today", label: "Today" },
  { id: "meds", label: "Plan" },
  { id: "log", label: "History" },
  { id: "doctor", label: "Risk" }
];

let state = loadState();

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) return structuredClone(defaultState);
    return {
      ...structuredClone(defaultState),
      ...stored,
      meds: Array.isArray(stored.meds) ? stored.meds : seedMeds,
      events: Array.isArray(stored.events) ? stored.events : seedEvents
    };
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setScreen(screen, options = {}) {
  state.screen = screen;
  Object.assign(state, options);
  saveState();
  render();
}

function resetDemo() {
  state = structuredClone(defaultState);
  saveState();
  render();
}

function activeMeds() {
  return state.meds.filter((med) => med.status !== "archived");
}

function archivedMeds() {
  return state.meds.filter((med) => med.status === "archived");
}

function getMed(id) {
  return state.meds.find((med) => med.id === id) || activeMeds()[0] || seedMeds[0];
}

function todayEventForMed(medId) {
  return state.events.find((event) => event.medId === medId && event.date === todayLabel);
}

function pendingLockMeds() {
  return activeMeds().filter((med) => todayEventForMed(med.id)?.status !== "confirmed");
}

function statusCopy(status) {
  const map = {
    confirmed: "Taken",
    uncertain: "Not sure",
    later: "Remind later",
    late: "Late record",
    missed: "Missing",
    pending: "Pending"
  };
  return map[status] || "Pending";
}

function frequencyCopy(med) {
  if (med.frequency === "daily") return "Daily";
  if (med.frequency === "weekly") return "Weekly";
  if (med.frequency === "as-needed") return "As needed";
  return "Custom";
}

function dueCopy(med) {
  if (med.frequency === "weekly") return `${med.reminderDay || "Friday"} ${med.reminderTime || "20:00"}`;
  if (med.frequency === "as-needed") return "Only when needed";
  return `Today ${med.reminderTime || "08:00"}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stats() {
  const todayEvents = state.events.filter((event) => event.date === todayLabel);
  const active = activeMeds();
  const activeIds = new Set(active.map((med) => med.id));
  const confirmedIds = new Set(
    todayEvents
      .filter((event) => activeIds.has(event.medId) && event.status === "confirmed")
      .map((event) => event.medId)
  );
  const late = state.events.filter((event) => activeIds.has(event.medId) && event.status === "late").length;
  const missing = todayEvents.filter(
    (event) => activeIds.has(event.medId) && (event.status === "missed" || event.status === "later")
  ).length;
  const confirmed = confirmedIds.size;
  const pending = Math.max(active.length - confirmed, 0);
  const denominator = Math.max(active.length, 1);
  return {
    active: active.length,
    confirmed,
    pending,
    late,
    missing,
    adherence: Math.round((confirmed / denominator) * 100)
  };
}

function recordCheckIn(medId, status, source = "today", note = "") {
  const med = getMed(medId);
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  const existing = todayEventForMed(med.id);
  const nextNote = note || `${statusCopy(status)} from ${source}.`;

  if (existing) {
    if (existing.status === "confirmed" && status === "confirmed") return;
    existing.status = status;
    existing.time = time;
    existing.source = source;
    existing.note = nextNote;
  } else {
    state.events.unshift({
      id: `event-${Date.now()}`,
      medId: med.id,
      medName: med.name,
      date: todayLabel,
      time,
      status,
      source,
      note: nextNote
    });
  }

  state.activeReminderMedId = med.id;
  state.lockSnoozed = false;
  saveState();
}

function saveMedicationFromForm() {
  const name = document.querySelector("#med-name")?.value.trim();
  const dose = document.querySelector("#med-dose")?.value.trim() || "As prescribed";
  const frequency = document.querySelector("#med-frequency")?.value || "daily";
  const reminderDay = document.querySelector("#med-day")?.value.trim() || "Every day";
  const reminderTime = document.querySelector("#med-time")?.value || "20:00";

  if (!name) {
    const field = document.querySelector("#med-name");
    field?.focus();
    field?.classList.add("field-error");
    return;
  }

  if (state.editingMedId) {
    state.meds = state.meds.map((med) =>
      med.id === state.editingMedId
        ? { ...med, name, dose, frequency, reminderDay, reminderTime, status: "active" }
        : med
    );
  } else {
    const newMed = {
      id: `med-${Date.now()}`,
      name,
      dose,
      frequency,
      reminderDay,
      reminderTime,
      status: "active",
      createdAt: new Date().toISOString()
    };
    state.meds.unshift(newMed);
    state.activeReminderMedId = newMed.id;
  }

  state.showMedForm = false;
  state.editingMedId = null;
  saveState();
  setScreen("today");
}

function archiveMedication(medId) {
  state.meds = state.meds.map((med) => (med.id === medId ? { ...med, status: "archived" } : med));
  saveState();
  render();
}

function restoreMedication(medId) {
  state.meds = state.meds.map((med) => (med.id === medId ? { ...med, status: "active" } : med));
  saveState();
  render();
}

function deleteMedication(medId) {
  state.meds = state.meds.filter((med) => med.id !== medId);
  state.events = state.events.filter((event) => event.medId !== medId);
  saveState();
  render();
}

function medicationForm() {
  const editing = state.editingMedId ? getMed(state.editingMedId) : null;
  const med = editing || {
    name: "",
    dose: "",
    frequency: "daily",
    reminderDay: "Every day",
    reminderTime: "20:00"
  };
  const reminderLabel = state.reminderEnabled ? "On" : "Off";

  return `
    <section class="apple-med-flow" aria-label="Add medication">
      <div class="apple-sheet-head">
        <button class="text-btn" data-action="cancel-med-form">Cancel</button>
        <strong>${editing ? "Edit Medication" : "Add Medication"}</strong>
        <button class="text-btn strong" data-action="save-medication">Done</button>
      </div>
      <div class="med-hero-card">
        <div class="pill-visual"><span></span><span></span></div>
        <div>
          <span class="tiny-label dark">Medication</span>
          <h2>${editing ? escapeHtml(med.name) : "What are you taking?"}</h2>
          <p>Record the doctor's plan. CareLoop only reminds and logs. It never changes dosage.</p>
        </div>
      </div>
      <div class="ios-group">
        <div class="ios-row stacked">
          <label for="med-name">Name</label>
          <input id="med-name" value="${escapeHtml(med.name)}" placeholder="e.g: Blood pressure pills" />
        </div>
        <div class="ios-row stacked">
          <label for="med-dose">Dose note</label>
          <input id="med-dose" value="${escapeHtml(med.dose)}" placeholder="1 tablet after dinner" />
        </div>
      </div>
      <div class="setup-step-title">Schedule</div>
      <div class="ios-group">
        <div class="ios-row">
          <label for="med-frequency">Frequency</label>
          <select id="med-frequency">
            <option value="daily" ${med.frequency === "daily" ? "selected" : ""}>Every Day</option>
            <option value="weekly" ${med.frequency === "weekly" ? "selected" : ""}>Weekly</option>
            <option value="as-needed" ${med.frequency === "as-needed" ? "selected" : ""}>As Needed</option>
            <option value="custom" ${med.frequency === "custom" ? "selected" : ""}>Custom</option>
          </select>
        </div>
        <div class="ios-row">
          <label for="med-time">Reminder</label>
          <input id="med-time" type="time" value="${escapeHtml(med.reminderTime)}" />
        </div>
        <div class="ios-row stacked">
          <label for="med-day">Day / rule</label>
          <input id="med-day" value="${escapeHtml(med.reminderDay)}" placeholder="Every day / Friday / Custom rule" />
        </div>
      </div>
      <div class="setup-step-title">Reminder behavior</div>
      <div class="ios-group">
        <button class="ios-row reminder-preview toggle-row" data-action="toggle-reminder">
          <div>
            <strong>15 min heads up</strong>
            <span>Lock-screen reminder appears before the scheduled time and stays until a record is captured.</span>
          </div>
          <span class="switch-on ${state.reminderEnabled ? "" : "off"}">${reminderLabel}</span>
        </button>
      </div>
      <button class="primary full" data-action="save-medication">${editing ? "Save medication" : "Add to Today"}</button>
    </section>
  `;
}

function entry() {
  const s = stats();
  return `
    <section class="hero entry-hero">
      <div class="brand-row"><span class="logo-dot"></span><span>CARELOOP HOME</span></div>
      <h1>Stay on your treatment path.</h1>
      <p>Set up a medication plan, record today's doses, and use AI-monitored alerts to prevent drop-off.</p>
      <div class="hero-actions">
        <button class="primary" data-screen="today">Start Today</button>
        <button class="secondary" data-screen="meds" data-open-form="true">Add Medication</button>
      </div>
    </section>
    <section class="widget-row">
      <button class="widget-card" data-screen="today">
        <span>Today</span>
        <strong>${s.confirmed}/${Math.max(s.active, 1)} recorded</strong>
        <small>${s.pending} pending check-in</small>
      </button>
      <button class="widget-card" data-screen="doctor">
        <span>Risk preview</span>
        <strong>15 min heads up</strong>
        <small>Open AI-monitored alert</small>
      </button>
    </section>
  `;
}

function today() {
  const meds = activeMeds();
  const s = stats();
  if (!meds.length) {
    return `
      <section class="panel empty-state">
        <h2>No medication plan yet</h2>
        <p>Create at least one medication plan before CareLoop can show today's tasks.</p>
        <button class="primary full" data-screen="meds" data-open-form="true">Create medication plan</button>
      </section>
    `;
  }

  return `
    <section class="summary-band">
      <div><span>Today</span><strong>${s.adherence}%</strong></div>
      <div><span>Pending</span><strong>${s.pending}</strong></div>
      <div><span>Late</span><strong>${s.late}</strong></div>
    </section>
    <section class="panel">
      <div class="section-heading"><span>Today's medications</span><button class="ghost mini" data-screen="meds" data-open-form="true">Add</button></div>
      <div class="task-list">
        ${meds
          .map((med) => {
            const event = todayEventForMed(med.id);
            const status = event?.status || "pending";
            const isTaken = status === "confirmed";
            return `
              <article class="task-card ${status !== "pending" ? "task-complete" : ""}">
                <div class="task-topline">
                  <div>
                    <strong>${escapeHtml(med.name)}</strong>
                    <span>${escapeHtml(med.dose)} - ${frequencyCopy(med)}</span>
                  </div>
                  <em>${statusCopy(status)}</em>
                </div>
                <div class="task-meta">Due ${dueCopy(med)}${event ? ` - recorded ${event.time}` : ""}</div>
                <div class="task-actions">
                  <button class="primary compact ${isTaken ? "is-recorded" : ""}" data-action="check-in" data-med-id="${med.id}" data-status="confirmed" ${isTaken ? "disabled" : ""}>${isTaken ? "Recorded" : "Taken"}</button>
                  <button class="secondary compact" data-action="check-in" data-med-id="${med.id}" data-status="uncertain">Not sure</button>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function meds() {
  const active = activeMeds();
  const archived = archivedMeds();
  return `
    <section class="plan-header">
      <div>
        <span class="tiny-label dark">Plan</span>
        <h2>Medications</h2>
        <p>Archive removes a medication from today's plan but keeps all history records.</p>
      </div>
      <button class="primary mini" data-action="new-medication">Add</button>
    </section>
    ${state.showMedForm ? medicationForm() : ""}
    <section class="panel">
      <div class="section-heading clean-heading"><span>Active medications - ${active.length}</span></div>
      <div class="med-list">
        ${active.length ? active.map((med) => `
          <article class="med-card health-card">
            <div class="med-icon-small"></div>
            <div class="med-copy">
              <strong>${escapeHtml(med.name)}</strong>
              <span>${escapeHtml(med.dose)}</span>
              <small>${frequencyCopy(med)} - ${dueCopy(med)}</small>
            </div>
            <div class="row-actions">
              <button class="ghost mini" data-action="edit-medication" data-med-id="${med.id}">Edit</button>
              <button class="ghost mini danger" data-action="archive-medication" data-med-id="${med.id}">Archive</button>
            </div>
          </article>
        `).join("") : `<div class="empty-inline">No active medication. Tap Add to create the first plan.</div>`}
      </div>
    </section>
    <section class="panel archived-panel">
      <div class="section-heading clean-heading"><span>Archived - History retained</span></div>
      <div class="med-list">
        ${archived.length ? archived.map((med) => `
          <article class="med-card health-card archived">
            <div class="med-icon-small muted"></div>
            <div class="med-copy">
              <strong>${escapeHtml(med.name)}</strong>
              <span>Archived. Past check-ins stay in History.</span>
            </div>
            <div class="row-actions">
              <button class="ghost mini" data-action="restore-medication" data-med-id="${med.id}">Restore</button>
              <button class="ghost mini danger" data-action="delete-medication" data-med-id="${med.id}">Delete</button>
            </div>
          </article>
        `).join("") : `<div class="empty-inline muted-line">No archived medication.</div>`}
      </div>
    </section>
  `;
}

function lock() {
  const pending = pendingLockMeds();
  if (!pending.length) {
    return `
      <section class="ordinary-lockscreen">
        <div class="ordinary-time">20:00</div>
        <div class="ordinary-date">Friday, Jun 26</div>
        <div class="ordinary-note">No pending medication records</div>
        <button class="unlock-demo" data-screen="entry">Unlock</button>
      </section>
    `;
  }

  return `
    <section class="lockscreen reminder-lockscreen">
      <div class="lock-status">20:00 - Lock Screen</div>
      <div class="lock-card multi-lock-card">
        <span class="tiny-label">15 min heads up</span>
        <h2>Medication records due today</h2>
        <p>This reminder stays on the lock screen until each medication is recorded.</p>
        <div class="lock-med-list">
          ${pending.map((med) => `
            <article class="lock-med-row">
              <div>
                <strong>${escapeHtml(med.name)}</strong>
                <span>${escapeHtml(med.dose)} - ${dueCopy(med)}</span>
              </div>
              <button class="primary compact" data-action="check-in" data-med-id="${med.id}" data-status="confirmed" data-source="lock-screen">Taken</button>
            </article>
          `).join("")}
        </div>
        <button class="ghost full" data-action="remind-later-lock">Remind later</button>
      </div>
    </section>
  `;
}

function log() {
  const s = stats();
  return `
    <section class="summary-band">
      <div><span>Active</span><strong>${s.active}</strong></div>
      <div><span>Taken</span><strong>${s.confirmed}</strong></div>
      <div><span>Late</span><strong>${s.late}</strong></div>
    </section>
    <section class="panel">
      <div class="section-heading"><span>History</span><button class="ghost mini" data-action="reset-demo">Reset</button></div>
      <div class="timeline">
        ${state.events.map((event) => `
          <article class="timeline-item">
            <div class="timeline-dot ${event.status}"></div>
            <div>
              <strong>${escapeHtml(event.medName)} - ${statusCopy(event.status)}</strong>
              <span>${event.date} ${event.time} - ${escapeHtml(event.source)}</span>
              <p>${escapeHtml(event.note)}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
    <section class="panel compact-panel">
      <div class="section-heading"><span>Data rule</span></div>
      <p class="safe-copy">Archiving a medication does not delete historical records. A record is counted as late only when it is logged more than 1 hour after the scheduled time.</p>
    </section>
  `;
}

function doctor() {
  const s = stats();
  const riskLevel = s.missing >= 2 || s.pending >= 2 ? "High" : s.late >= 1 ? "Watch" : "Stable";
  return `
    <section class="panel risk-panel">
      <div class="section-heading"><span>AI-monitored risk alert</span></div>
      <h2>Prevent medication drop-off.</h2>
      <p>AI monitors late records, missing records, and repeated delays. It can suggest setting an alarm, but it does not provide medical advice.</p>
      <div class="risk-score-card">
        <span>Current risk</span>
        <strong>${riskLevel}</strong>
        <small>${s.pending} pending today - ${s.late} late record(s)</small>
      </div>
      <div class="rule-list">
        <article class="rule-card active-rule">
          <div>
            <strong>Late record</strong>
            <span>Count as late only when the user records medication more than 1 hour after the scheduled time.</span>
          </div>
          <em>On</em>
        </article>
        <article class="rule-card high-rule">
          <div>
            <strong>Missing record risk</strong>
            <span>If records are missing repeatedly, flag drop-off risk and prompt the user to set an alarm.</span>
          </div>
          <em>High</em>
        </article>
        <article class="rule-card">
          <div>
            <strong>Alarm suggestion</strong>
            <span>Prompt: Would you like to set a phone alarm 15 minutes before this medication?</span>
          </div>
          <em>Draft</em>
        </article>
      </div>
      <button class="primary full" data-action="open-reminder">Preview lock screen</button>
    </section>
  `;
}

function page() {
  const pages = { entry, today, meds, lock, log, doctor };
  return (pages[state.screen] || entry)();
}

function renderNav() {
  if (["lock"].includes(state.screen)) return "";
  return `
    <nav class="nav bottom-nav">
      ${navItems.map((item) => `
        <button class="nav-item ${state.screen === item.id ? "active" : ""}" data-screen="${item.id}">
          <small>${item.label}</small>
        </button>
      `).join("")}
    </nav>
  `;
}

function render() {
  const app = document.querySelector("#app");
  const hasNav = !["lock"].includes(state.screen);
  app.innerHTML = `
    <div class="content ${hasNav ? "with-nav" : ""} ${state.screen === "lock" ? "lock-mode" : ""}">${page()}</div>
    ${renderNav()}
  `;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const screen = button.dataset.screen;
  const action = button.dataset.action;
  const medId = button.dataset.medId;

  if (screen) {
    const options = {};
    if (button.dataset.openForm === "true") {
      options.showMedForm = true;
      options.editingMedId = null;
    }
    setScreen(screen, options);
    return;
  }

  if (action === "new-medication") {
    state.showMedForm = true;
    state.editingMedId = null;
    saveState();
    render();
  }

  if (action === "cancel-med-form") {
    state.showMedForm = false;
    state.editingMedId = null;
    saveState();
    render();
  }

  if (action === "save-medication") saveMedicationFromForm();

  if (action === "toggle-reminder") {
    state.reminderEnabled = !state.reminderEnabled;
    saveState();
    const badge = button.querySelector(".switch-on");
    if (badge) {
      badge.textContent = state.reminderEnabled ? "On" : "Off";
      badge.classList.toggle("off", !state.reminderEnabled);
    }
  }

  if (action === "edit-medication") {
    state.showMedForm = true;
    state.editingMedId = medId;
    saveState();
    render();
  }

  if (action === "archive-medication") archiveMedication(medId);
  if (action === "restore-medication") restoreMedication(medId);
  if (action === "delete-medication") deleteMedication(medId);

  if (action === "open-reminder") setScreen("lock");

  if (action === "check-in") {
    const source = button.dataset.source || "today";
    recordCheckIn(medId, button.dataset.status, source);
    setScreen(source === "lock-screen" ? "lock" : "today");
  }

  if (action === "remind-later-lock") {
    state.lockSnoozed = true;
    saveState();
    render();
  }

  if (action === "reset-demo") resetDemo();
});

render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/service-worker.js").catch(() => {});
}
