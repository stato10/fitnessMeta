/* module: reducer (pure; no DOM/Date.now/localStorage) */
(function () {
  "use strict";

  function needsTeach(state, plan, cursor, hasEverTaught) {
    var set = plan.sets[cursor];
    if (!set) return false;
    var ex = plan.exercises[set.exerciseId];
    if (!ex || !ex.steps || !ex.steps.length) return false;
    if (state.taught.indexOf(ex.id) !== -1) return false;
    if (state.level === "intermediate" && hasEverTaught(ex.id)) return false;
    return true;
  }

  function markTaught(state, plan, cursor) {
    var set = plan.sets[cursor];
    if (!set) return;
    var id = set.exerciseId;
    if (state.taught.indexOf(id) === -1) state.taught.push(id);
    return id;
  }

  function idleState(t) {
    return {
      schemaVersion: 2,
      planId: null,
      pendingGoal: null,
      level: null,
      mode: null,
      machinePage: 0,
      machineId: null,
      startedAt: null,
      cursor: 0,
      logged: [],
      phase: "Home",
      phaseEnteredAt: t,
      setStartedAt: null,
      restEndsAt: null,
      adjust: null,
      teachStep: 0,
      taught: [],
      menuReturn: null,
      paused: false,
      pendingCue: null
    };
  }

  function freshSession(planId, t, level) {
    return {
      schemaVersion: 2,
      planId: planId,
      pendingGoal: null,
      level: level || "beginner",
      mode: null,
      machinePage: 0,
      machineId: null,
      startedAt: t,
      cursor: 0,
      logged: [],
      phase: "Teach",
      phaseEnteredAt: t,
      setStartedAt: null,
      restEndsAt: null,
      adjust: null,
      teachStep: 0,
      taught: [],
      menuReturn: null,
      paused: false,
      pendingCue: null
    };
  }

  function resetToHome(t, resetPlanTo) {
    if (typeof resetPlanTo === "function") resetPlanTo("fullbody", "beginner");
    return idleState(t);
  }

  function enter(state, phase, t) {
    state.phase = phase;
    state.phaseEnteredAt = t;
    return state;
  }

  function clone(state) {
    return JSON.parse(JSON.stringify(state));
  }

  function withinIdempotency(state, t, IDEMPOTENCY_MS) {
    return t - state.phaseEnteredAt < IDEMPOTENCY_MS;
  }

  function logSet(state, plan, reps, t, adjusted) {
    var set = plan.sets[state.cursor];
    state.logged.push({
      planIndex: state.cursor,
      actualReps: reps,
      actualWeightKg: set.targetWeightKg,
      completedAt: t,
      restStartedAt: null,
      restEndedAt: null,
      restSkipped: false,
      adjusted: !!adjusted
    });
  }

  function goToCursorReadyOrTeach(state, plan, t, hasEverTaught) {
    state.setStartedAt = null;
    state.adjust = null;
    state.restEndsAt = null;
    if (needsTeach(state, plan, state.cursor, hasEverTaught)) {
      state.teachStep = 0;
      return enter(state, "Teach", t);
    }
    return enter(state, "SetReady", t);
  }

  function advanceAfterSet(state, plan, t, hasEverTaught) {
    var finished = plan.sets[state.cursor];
    state.cursor += 1;
    if (state.cursor >= plan.sets.length) {
      state.restEndsAt = null;
      state.setStartedAt = null;
      state.adjust = null;
      return enter(state, "Summary", t);
    }
    if (!finished.restSec) {
      return goToCursorReadyOrTeach(state, plan, t, hasEverTaught);
    }
    state.restEndsAt = t + finished.restSec * 1000;
    state.setStartedAt = null;
    state.adjust = null;
    var last = state.logged[state.logged.length - 1];
    last.restStartedAt = t;
    return enter(state, "Resting", t);
  }

  function endRest(state, t, skipped, plan, hasEverTaught) {
    var last = state.logged[state.logged.length - 1];
    if (last) {
      last.restEndedAt = t;
      last.restSkipped = !!skipped;
    }
    state.restEndsAt = null;
    if (state.cursor >= plan.sets.length) {
      return enter(state, "Summary", t);
    }
    return goToCursorReadyOrTeach(state, plan, t, hasEverTaught);
  }

  function reducer(state, event, t, plan, deps) {
    state = clone(state);
    deps = deps || {};
    var IDEMPOTENCY_MS = deps.IDEMPOTENCY_MS;
    var STALE_CUE_MS = deps.STALE_CUE_MS;
    var resetPlanTo = deps.resetPlanTo;
    var hasEverTaught = deps.hasEverTaught || function () { return false; };
    var MACHINE_IDS = deps.MACHINE_IDS;
    var PLANS = deps.PLANS;
    var EX = deps.EX;
    var makeMachinePlan = deps.makeMachinePlan;
    var fresh = deps.freshSession || freshSession;

    if (event.t === "VISIBILITY") {
      state.paused = !event.visible;
      if (event.visible && state.restEndsAt != null && t >= state.restEndsAt &&
          (state.phase === "Resting" || state.menuReturn === "Resting")) {
        var overdue = t - state.restEndsAt;
        state.menuReturn = null;
        state = endRest(state, t, false, plan, hasEverTaught);
        if (overdue <= STALE_CUE_MS) state.pendingCue = "rest_over";
      }
      return state;
    }

    if (event.t === "TICK") {
      if (state.restEndsAt != null && t >= state.restEndsAt &&
          (state.phase === "Resting" || state.menuReturn === "Resting")) {
        state.menuReturn = null;
        state = endRest(state, t, false, plan, hasEverTaught);
        state.pendingCue = "rest_over";
      }
      return state;
    }

    var navWhilePaused = {
      SELECT_HOME: 1, SELECT_PLAN: 1, SELECT_LEVEL: 1, SELECT_EQUIP: 1,
      SELECT_MACHINE: 1, MACHINE_MORE: 1, TRAIN_MACHINE: 1, BACK: 1,
      MACHINE_TIP: 1
    };
    if (state.paused && !navWhilePaused[event.t]) return state;

    if (event.t === "SELECT_HOME") {
      if (state.phase !== "Home" && state.phase !== "Idle") return state;
      if (event.mode === "train") {
        state.mode = "train";
        state.pendingGoal = null;
        state.level = null;
        state.machineId = null;
        return enter(state, "PlanSelect", t);
      }
      if (event.mode === "machines") {
        state.mode = "machines";
        state.machinePage = 0;
        state.machineId = null;
        state.pendingGoal = null;
        state.level = null;
        return enter(state, "MachineList", t);
      }
      return state;
    }

    if (event.t === "SELECT_PLAN") {
      if (state.phase !== "PlanSelect") return state;
      var goal = event.planId;
      if (goal !== "fullbody" && goal !== "upper" && goal !== "legs") return state;
      state.pendingGoal = goal;
      state.planId = null;
      state.level = null;
      return enter(state, "LevelSelect", t);
    }

    if (event.t === "SELECT_LEVEL") {
      if (state.phase !== "LevelSelect" || !state.pendingGoal) return state;
      if (event.level !== "beginner" && event.level !== "intermediate") return state;
      state.level = event.level;
      return enter(state, "EquipSelect", t);
    }

    if (event.t === "SELECT_EQUIP") {
      if (state.phase !== "EquipSelect" || !state.pendingGoal || !state.level) return state;
      var pid = state.pendingGoal + (event.equip === "free" ? "_free" : "");
      if (!PLANS[pid]) return state;
      var lvl = state.level;
      if (resetPlanTo) resetPlanTo(pid, lvl);
      var session = fresh(pid, t, lvl);
      return goToCursorReadyOrTeach(session, deps.clonePlan(pid, lvl), t, hasEverTaught);
    }

    if (event.t === "SELECT_MACHINE") {
      if (state.phase !== "MachineList") return state;
      if (MACHINE_IDS.indexOf(event.machineId) === -1) return state;
      state.machineId = event.machineId;
      state.teachStep = 0;
      return enter(state, "MachineDetail", t);
    }

    if (event.t === "MACHINE_MORE") {
      if (state.phase !== "MachineList") return state;
      var next = (state.machinePage || 0) + 1;
      if (next * 2 >= MACHINE_IDS.length) return state;
      state.machinePage = next;
      state.phaseEnteredAt = t;
      return state;
    }

    if (event.t === "MACHINE_TIP") {
      if (state.phase !== "MachineDetail" || !state.machineId) return state;
      if (withinIdempotency(state, t, IDEMPOTENCY_MS)) return state;
      var mex = EX[state.machineId];
      var msteps = (mex && mex.steps) || [];
      if (!msteps.length) return state;
      state.teachStep = (state.teachStep + 1) % msteps.length;
      state.phaseEnteredAt = t;
      return state;
    }

    if (event.t === "TRAIN_MACHINE") {
      if (state.phase !== "MachineDetail" || !state.machineId) return state;
      var mpid = "machine_" + state.machineId;
      var mplan = makeMachinePlan(EX, deps.MACHINE_DEFAULTS, deps.LEVEL_MULT, state.machineId, "beginner");
      if (!mplan) return state;
      if (resetPlanTo) resetPlanTo(mpid, "beginner");
      var mSession = fresh(mpid, t, "beginner");
      return goToCursorReadyOrTeach(mSession, mplan, t, hasEverTaught);
    }

    if (event.t === "TEACH_NEXT") {
      if (state.phase !== "Teach") return state;
      if (withinIdempotency(state, t, IDEMPOTENCY_MS)) return state;
      var exT = plan.exercises[plan.sets[state.cursor].exerciseId];
      var steps = (exT && exT.steps) || [];
      if (state.teachStep >= steps.length - 1) {
        return finishTeach(state, plan, t, hasEverTaught, deps.persistTaught);
      }
      state.teachStep += 1;
      state.phaseEnteredAt = t;
      return state;
    }

    if (event.t === "TEACH_SKIP") {
      if (state.phase !== "Teach") return state;
      if (withinIdempotency(state, t, IDEMPOTENCY_MS)) return state;
      return finishTeach(state, plan, t, hasEverTaught, deps.persistTaught);
    }

    if (event.t === "HOW_TO") {
      if (state.phase !== "SetReady" && state.phase !== "Menu") return state;
      state.teachStep = 0;
      state.menuReturn = null;
      return enter(state, "Teach", t);
    }

    if (event.t === "BACK") {
      if (state.phase === "PlanSelect") {
        state.mode = null;
        state.pendingGoal = null;
        return enter(state, "Home", t);
      }
      if (state.phase === "LevelSelect") {
        state.level = null;
        return enter(state, "PlanSelect", t);
      }
      if (state.phase === "EquipSelect") {
        return enter(state, "LevelSelect", t);
      }
      if (state.phase === "MachineList") {
        state.mode = null;
        state.machineId = null;
        state.machinePage = 0;
        return enter(state, "Home", t);
      }
      if (state.phase === "MachineDetail") {
        state.machineId = null;
        state.teachStep = 0;
        return enter(state, "MachineList", t);
      }
      if (state.phase === "Menu") {
        var backTo = state.menuReturn || "SetReady";
        state.menuReturn = null;
        return enter(state, backTo, t);
      }
      if (state.phase === "QuitConfirm") {
        var ret = state.menuReturn || "SetReady";
        state.menuReturn = null;
        return enter(state, ret, t);
      }
      if (state.phase === "Teach") {
        state.teachStep = 0;
        return enter(state, "SetReady", t);
      }
      return state;
    }

    if (event.t === "OPEN_MENU") {
      if (state.phase !== "SetReady" && state.phase !== "Resting" && state.phase !== "Summary") return state;
      state.menuReturn = state.phase;
      return enter(state, "Menu", t);
    }

    if (event.t === "QUIT_ASK") {
      if (state.phase !== "Menu" && state.phase !== "SetReady" && state.phase !== "Resting" && state.phase !== "Summary" && state.phase !== "Teach") return state;
      if (state.phase !== "Menu") state.menuReturn = state.phase;
      return enter(state, "QuitConfirm", t);
    }

    if (event.t === "QUIT_CONFIRM") {
      if (state.phase !== "QuitConfirm") return state;
      if (withinIdempotency(state, t, IDEMPOTENCY_MS)) return state;
      return resetToHome(t, resetPlanTo);
    }

    if (event.t === "PRIMARY") {
      if (withinIdempotency(state, t, IDEMPOTENCY_MS)) return state;
      if (state.phase === "SetReady") {
        state.setStartedAt = t;
        state.adjust = null;
        return enter(state, "SetActive", t);
      }
      if (state.phase === "SetActive") {
        var reps = state.adjust ? state.adjust.reps : plan.sets[state.cursor].targetReps;
        var adjusted = !!(state.adjust && state.adjust.reps !== plan.sets[state.cursor].targetReps);
        logSet(state, plan, reps, t, adjusted);
        return advanceAfterSet(state, plan, t, hasEverTaught);
      }
      if (state.phase === "Resting") {
        return endRest(state, t, true, plan, hasEverTaught);
      }
      return state;
    }

    if (event.t === "ADJUST") {
      if (state.phase !== "SetReady") return state;
      var cur = plan.sets[state.cursor];
      state.adjust = { reps: cur.targetReps };
      return enter(state, "Adjusting", t);
    }

    if (event.t === "ADJUST_DELTA") {
      if (state.phase !== "Adjusting" || !state.adjust) return state;
      state.adjust.reps = Math.max(1, Math.min(50, state.adjust.reps + event.delta));
      return state;
    }

    if (event.t === "CONFIRM") {
      if (state.phase !== "Adjusting") return state;
      return enter(state, "SetReady", t);
    }

    if (event.t === "UNDO") {
      if (state.phase !== "Resting" && state.phase !== "Menu") return state;
      if (state.phase === "Menu" && state.menuReturn !== "Resting") return state;
      if (withinIdempotency(state, t, IDEMPOTENCY_MS)) return state;
      var popped = state.logged.pop();
      if (!popped) return state;
      state.cursor = popped.planIndex;
      state.restEndsAt = null;
      state.setStartedAt = popped.completedAt;
      state.adjust = null;
      state.menuReturn = null;
      return enter(state, "SetActive", t);
    }

    if (event.t === "FINISH") {
      if (state.phase !== "Summary") return state;
      return resetToHome(t, resetPlanTo);
    }

    if (event.t === "ADD_SET") {
      if (state.phase !== "Summary") return state;
      var lastSet = plan.sets[plan.sets.length - 1];
      plan.sets.push(JSON.parse(JSON.stringify(lastSet)));
      state.cursor = plan.sets.length - 1;
      state.adjust = null;
      return goToCursorReadyOrTeach(state, plan, t, hasEverTaught);
    }

    return state;
  }

  function finishTeach(state, plan, t, hasEverTaught, persistTaught) {
    var id = markTaught(state, plan, state.cursor);
    if (id && typeof persistTaught === "function") persistTaught(id);
    state.teachStep = 0;
    return enter(state, "SetReady", t);
  }

  var api = {
    idleState: idleState,
    freshSession: freshSession,
    needsTeach: needsTeach,
    markTaught: markTaught,
    reducer: reducer
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.reducer = api;
})();