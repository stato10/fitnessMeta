/* edge-cases.test.js — table tests on the pure reducer with a fake clock.
 *
 * Mirrors docs/04 priority list from the SetPace brief:
 *   1. Double PRIMARY 120ms apart after set complete → rest not skipped
 *   2. Focus on secondary action survives 10 rest ticks
 *   3. Clock jump forward/back while Resting
 *   4. Visibility resume with rest overdue ≤30s vs >30s (cue vs no flash)
 *   5. One-set plan reaches Summary
 *   6. Zero-rest set never enters Resting
 *   7. Undo restores correct cursor and phase
 *   8. ADD_SET extends session plan only; reload restores extra sets
 *   9. Stale session >6h discarded
 *  10. Intermediate skips Teach for previously taught ids
 *
 * Run: node --test test/
 */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

// --- Load pure modules in Node (same sandbox trick as build.mjs) -----------
const SRC = resolve(__dirname, "..", "src");
const MODULES = [
  "core/constants.js",
  "core/plan.js",
  "core/reducer.js",
  "core/render.js",
  "adapters/storage.js"
];

const sandbox = { SetPace: { api: {} } };
for (const m of MODULES) {
  const code = readFileSync(resolve(SRC, m), "utf8");
  const fn = new Function("SetPace", "module", "exports", code + "\n;return SetPace;");
  fn(sandbox.SetPace, undefined, {});
}

const { IDEMPOTENCY_MS, STALE_CUE_MS, LEVEL_MULT } = sandbox.SetPace.api.constants;
const planApi = sandbox.SetPace.api.plan;
const reducerApi = sandbox.SetPace.api.reducer;
const renderApi = sandbox.SetPace.api.render;
const storageApi = sandbox.SetPace.api.storage;

// --- Fixtures ----------------------------------------------------------------
const EX = {
  squat: { id: "squat", name: "Squat", unit: "reps", steps: [], demo: "bwsquat", gif: null },
  press: { id: "press", name: "Press", unit: "reps", steps: [], demo: "chestpress", gif: null }
};
const EX_STEPS = {
  squat: { id: "squat", name: "Squat", unit: "reps", steps: ["Feet shoulder width", "Hips back"], demo: "bwsquat", gif: null },
  press: { id: "press", name: "Press", unit: "reps", steps: ["Push forward"], demo: "chestpress", gif: null }
};

const PLAN = {
  id: "fullbody",
  name: "Full body",
  exercises: EX,
  sets: [
    { exerciseId: "squat", targetReps: 10, targetWeightKg: 20, restSec: 60 },
    { exerciseId: "press", targetReps: 8, targetWeightKg: 30, restSec: 0 }
  ]
};

const PLAN_ONESET = {
  id: "oneset",
  name: "One set",
  exercises: EX,
  sets: [{ exerciseId: "squat", targetReps: 10, targetWeightKg: 20, restSec: 0 }]
};

const PLAN_STEPS = {
  id: "steps",
  name: "Steps",
  exercises: EX_STEPS,
  sets: [{ exerciseId: "squat", targetReps: 10, targetWeightKg: 20, restSec: 60 }]
};

const PLANS = {
  fullbody: PLAN,
  oneset: PLAN_ONESET,
  steps: PLAN_STEPS
};

// --- Fake clock + deps --------------------------------------------------------
let now = 0;
const clock = () => now;

function makeDeps(overrides) {
  return Object.assign(
    {
      IDEMPOTENCY_MS,
      STALE_CUE_MS,
      resetPlanTo: () => {},
      hasEverTaught: () => false,
      MACHINE_IDS: [],
      PLANS,
      EX,
      makeMachinePlan: planApi.makeMachinePlan,
      freshSession: reducerApi.freshSession,
      clonePlan: (id, lvl) => planApi.clonePlan(PLANS, EX, {}, LEVEL_MULT, id, lvl),
      persistTaught: () => {}
    },
    overrides || {}
  );
}

// Mirrors goToCursorReadyOrTeach when needsTeach is false (no steps).
function readyState(planId, t, level) {
  const s = reducerApi.freshSession(planId, t, level || "beginner");
  s.phase = "SetReady";
  s.phaseEnteredAt = t;
  return s;
}

// Drive a set to completion: SetReady → SetActive → (log + advance)
function completeSet(state, plan, deps, t) {
  return reducerApi.reducer(state, { t: "PRIMARY" }, t, plan, deps);
}

// --- 1. Double PRIMARY 100ms apart after SET → rest not skipped --------------
test("double PRIMARY 100ms apart after set complete does not skip rest", () => {
  now = 0;
  const deps = makeDeps();
  let s = readyState("fullbody", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, PLAN, deps); // → SetActive
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, PLAN, deps); // → Resting (cursor 1)
  assert.equal(s.phase, "Resting");
  assert.equal(s.logged.length, 1);
  assert.equal(s.restEndsAt, 600 + 60 * 1000);

  // Second PRIMARY 100ms later (within 250ms idempotency) must be dropped.
  const before = JSON.parse(JSON.stringify(s));
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 700, PLAN, deps);
  assert.equal(s.phase, "Resting", "rest must not be skipped by double-fire");
  assert.equal(s.logged.length, 1);
  assert.equal(s.restEndsAt, before.restEndsAt);
});

// --- 2. Focus on secondary action survives 10 rest ticks ---------------------
test("focus target (primary) survives 10 rest ticks", () => {
  now = 0;
  const deps = makeDeps();
  let s = readyState("fullbody", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, PLAN, deps); // SetActive
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, PLAN, deps); // Resting
  assert.equal(s.phase, "Resting");

  const frame0 = renderApi.render(s, 600, PLAN, {
    exerciseOf: planApi.exerciseOf,
    setProgress: planApi.setProgress,
    formatClock: planApi.formatClock,
    heroForSet: planApi.heroForSet,
    MACHINE_IDS: [],
    EX
  });
  assert.equal(frame0.actions[0].id, "primary", "primary is the default focus");

  // 10 ticks at 1s each — focus target must stay stable (keyed commit keeps it).
  for (let i = 1; i <= 10; i++) {
    now = 600 + i * 1000;
    s = reducerApi.reducer(s, { t: "TICK" }, now, PLAN, deps);
    assert.equal(s.phase, "Resting", "still resting at tick " + i);
    const f = renderApi.render(s, now, PLAN, {
      exerciseOf: planApi.exerciseOf,
      setProgress: planApi.setProgress,
      formatClock: planApi.formatClock,
      heroForSet: planApi.heroForSet,
      MACHINE_IDS: [],
      EX
    });
    assert.equal(f.actions[0].id, "primary", "primary stays actions[0] at tick " + i);
  }
});

// --- 3. Clock jump forward/back while Resting --------------------------------
test("clock jump forward ends rest; jump back keeps resting", () => {
  now = 0;
  const deps = makeDeps();
  let s = readyState("fullbody", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, PLAN, deps); // SetActive
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, PLAN, deps); // Resting, ends 60600
  assert.equal(s.phase, "Resting");

  // Forward jump past deadline.
  now = 70000;
  s = reducerApi.reducer(s, { t: "TICK" }, now, PLAN, deps);
  assert.equal(s.phase, "SetReady", "rest over → ready");
  assert.equal(s.pendingCue, "rest_over");

  // Backward: fresh rest, tick before deadline stays resting.
  now = 0;
  s = readyState("fullbody", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, PLAN, deps);
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, PLAN, deps);
  now = 5000; // < 60600
  s = reducerApi.reducer(s, { t: "TICK" }, now, PLAN, deps);
  assert.equal(s.phase, "Resting");
});

// --- 4. Visibility resume: overdue ≤30s cues, >30s does not ------------------
test("visibility resume: overdue ≤30s fires cue, >30s does not", () => {
  now = 0;
  const deps = makeDeps();

  // Overdue 1s (≤ 30s) → cue.
  let s = readyState("fullbody", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, PLAN, deps);
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, PLAN, deps); // ends 60600
  now = 61600; // overdue 1000ms
  s = reducerApi.reducer(s, { t: "VISIBILITY", visible: true }, now, PLAN, deps);
  assert.equal(s.phase, "SetReady");
  assert.equal(s.pendingCue, "rest_over", "≤30s overdue must cue");

  // Overdue 40s (> 30s) → no cue.
  now = 0;
  s = readyState("fullbody", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, PLAN, deps);
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, PLAN, deps); // ends 60600
  now = 100600; // overdue 40000ms
  s = reducerApi.reducer(s, { t: "VISIBILITY", visible: true }, now, PLAN, deps);
  assert.equal(s.phase, "SetReady");
  assert.equal(s.pendingCue, null, ">30s overdue must NOT cue");
});

// --- 5. One-set plan reaches Summary -----------------------------------------
test("one-set plan reaches Summary", () => {
  now = 0;
  const deps = makeDeps();
  let s = readyState("oneset", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, PLAN_ONESET, deps); // SetActive
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, PLAN_ONESET, deps); // Summary
  assert.equal(s.phase, "Summary");
  assert.equal(s.logged.length, 1);
});

// --- 6. Zero-rest set never enters Resting ------------------------------------
test("zero-rest set never enters Resting", () => {
  now = 0;
  const deps = makeDeps();
  let s = readyState("fullbody", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, PLAN, deps); // SetActive
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, PLAN, deps); // set0 restSec=60 → Resting
  assert.equal(s.phase, "Resting");

  // Now complete set 1 (restSec 0) — must go straight to ready, never Resting.
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 1200, PLAN, deps); // Skip rest → SetReady (set 1)
  assert.equal(s.phase, "SetReady");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 1500, PLAN, deps); // SetActive
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 1800, PLAN, deps); // set1 restSec=0 → Summary
  assert.equal(s.phase, "Summary", "zero-rest set must skip Resting");
});

// --- 7. Undo restores correct cursor and phase --------------------------------
test("undo restores cursor and SetActive phase", () => {
  now = 0;
  const deps = makeDeps();
  let s = readyState("fullbody", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, PLAN, deps); // SetActive
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, PLAN, deps); // Resting, cursor=1
  assert.equal(s.cursor, 1);
  assert.equal(s.logged.length, 1);

  s = reducerApi.reducer(s, { t: "OPEN_MENU" }, 900, PLAN, deps); // Menu
  assert.equal(s.phase, "Menu");
  assert.equal(s.menuReturn, "Resting");

  s = reducerApi.reducer(s, { t: "UNDO" }, 1300, PLAN, deps); // past idempotency
  assert.equal(s.phase, "SetActive");
  assert.equal(s.cursor, 0);
  assert.equal(s.logged.length, 0);
  assert.equal(s.setStartedAt, 600, "setStartedAt restored to completedAt");
});

// --- 8. ADD_SET extends session plan; reload restores extra sets --------------
test("ADD_SET extends session plan; reload restores extra sets", () => {
  now = 0;
  const deps = makeDeps();
  const sessionPlan = planApi.clonePlan(PLANS, EX, {}, LEVEL_MULT, "oneset", "beginner");
  let s = readyState("oneset", 0, "beginner");
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 300, sessionPlan, deps); // SetActive
  s = reducerApi.reducer(s, { t: "PRIMARY" }, 600, sessionPlan, deps); // Summary
  assert.equal(s.phase, "Summary");
  assert.equal(sessionPlan.sets.length, 1);

  s = reducerApi.reducer(s, { t: "ADD_SET" }, 900, sessionPlan, deps);
  assert.equal(sessionPlan.sets.length, 2, "session plan extended");
  assert.equal(s.cursor, 1);
  assert.equal(s.phase, "SetReady");

  // Reload: storage.load must restore the extra set from planSetsLen.
  const store = {};
  const fakeLS = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
  const origLS = global.localStorage;
  global.localStorage = fakeLS;
  try {
    storageApi.save("sp_key", { Home: 1 }, s, sessionPlan);
    const loaded = storageApi.load("sp_key", {
      now: clock,
      PLANS: { oneset: PLAN_ONESET },
      EX,
      LEVEL_MULT,
      isMachinePlanId: planApi.isMachinePlanId,
      clonePlan: (id, lvl) => planApi.clonePlan({ oneset: PLAN_ONESET }, EX, {}, LEVEL_MULT, id, lvl)
    });
    assert.ok(loaded, "session should load");
    assert.equal(loaded.plan.sets.length, 2, "extra set restored on reload");
  } finally {
    global.localStorage = origLS;
  }
});

// --- 9. Stale session >6h discarded -------------------------------------------
test("stale session >6h is discarded", () => {
  now = 1000 * 60 * 60 * 24; // 24h
  const store = {};
  const fakeLS = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
  };
  const origLS = global.localStorage;
  global.localStorage = fakeLS;
  try {
    const stale = {
      state: {
        schemaVersion: 2,
        planId: "oneset",
        level: "beginner",
        startedAt: now - 7 * 60 * 60 * 1000, // 7h old
        cursor: 0,
        logged: [],
        phase: "SetReady",
        phaseEnteredAt: now,
        taught: []
      },
      planId: "oneset",
      level: "beginner",
      planSetsLen: 1
    };
    store["sp_key"] = JSON.stringify(stale);
    const loaded = storageApi.load("sp_key", {
      now: clock,
      PLANS: { oneset: PLAN_ONESET },
      EX,
      LEVEL_MULT,
      isMachinePlanId: planApi.isMachinePlanId,
      clonePlan: (id, lvl) => planApi.clonePlan({ oneset: PLAN_ONESET }, EX, {}, LEVEL_MULT, id, lvl)
    });
    assert.equal(loaded, null, "stale session must be discarded");
    assert.equal(store["sp_key"], undefined, "stale key removed");
  } finally {
    global.localStorage = origLS;
  }
});

// --- 10. Intermediate skips Teach for previously taught ids -------------------
test("intermediate skips Teach for previously taught ids", () => {
  const deps = makeDeps({ hasEverTaught: (id) => id === "squat" });
  const s = reducerApi.freshSession("steps", 0, "intermediate");
  // needsTeach must be false for a previously-taught exercise at intermediate.
  assert.equal(
    reducerApi.needsTeach(s, PLAN_STEPS, 0, (id) => id === "squat"),
    false,
    "intermediate + ever-taught → no Teach"
  );
  // And true when never taught.
  assert.equal(
    reducerApi.needsTeach(s, PLAN_STEPS, 0, () => false),
    true,
    "intermediate + never-taught → Teach"
  );
});
