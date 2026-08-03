/* app: wires ports + boot/resume (schema v2) */
(function () {
  "use strict";

  var clock = SetPace.api.clock;
  var commitApi = SetPace.api.commit;
  var storage = SetPace.api.storage;
  var taught = SetPace.api.taught;
  var reducerApi = SetPace.api.reducer;
  var renderApi = SetPace.api.render;
  var constants = SetPace.api.constants;
  var planApi = SetPace.api.plan;
  var audio = SetPace.api.audio;

  var now = clock.now;
  var scheduleTick = clock.scheduleTick;
  var commit = commitApi.commit;

  var STORE_KEY = constants.STORE_KEY;
  var TAUGHT_KEY = constants.TAUGHT_KEY;
  var IDEMPOTENCY_MS = constants.IDEMPOTENCY_MS;
  var STALE_CUE_MS = constants.STALE_CUE_MS;
  var LEVEL_MULT = constants.LEVEL_MULT;
  var PRE_WORKOUT = constants.PRE_WORKOUT;
  var MACHINE_IDS = constants.MACHINE_IDS;
  var MACHINE_DEFAULTS = constants.MACHINE_DEFAULTS;
  var PLANS = constants.PLANS;
  var EX = constants.EX;

  var isMachinePlanId = planApi.isMachinePlanId;
  var clonePlan = planApi.clonePlan;
  var exerciseOf = planApi.exerciseOf;
  var setProgress = planApi.setProgress;
  var formatClock = planApi.formatClock;
  var heroForSet = planApi.heroForSet;
  var idleState = reducerApi.idleState;
  var freshSession = reducerApi.freshSession;
  var reducer = reducerApi.reducer;
  var render = renderApi.render;

  function clonePlanFor(planId, level) {
    return clonePlan(PLANS, EX, MACHINE_DEFAULTS, LEVEL_MULT, planId, level || "beginner");
  }

  var state = null;
  var plan = clonePlanFor("fullbody", "beginner");
  var tickTimer = null;
  var lastFocusId = "primary";

  function resetPlanTo(planId, level) {
    if (!planId) return;
    plan = clonePlanFor(planId, level || "beginner");
  }

  function save() {
    storage.save(STORE_KEY, PRE_WORKOUT, state, plan);
  }

  function load() {
    var loaded = storage.load(STORE_KEY, {
      now: now,
      PLANS: PLANS,
      EX: EX,
      LEVEL_MULT: LEVEL_MULT,
      isMachinePlanId: isMachinePlanId,
      clonePlan: clonePlanFor
    });
    if (!loaded) return null;
    if (loaded.state) {
      plan = loaded.plan;
      return loaded.state;
    }
    return loaded;
  }

  function hasEverTaught(id) {
    return taught.loadTaughtEver(TAUGHT_KEY).indexOf(id) !== -1;
  }

  function persistTaught(id) {
    taught.persistTaught(TAUGHT_KEY, id);
  }

  function paint() {
    var frame = render(state, now(), plan, {
      exerciseOf: exerciseOf,
      setProgress: setProgress,
      formatClock: formatClock,
      heroForSet: heroForSet,
      MACHINE_IDS: MACHINE_IDS,
      EX: EX
    });
    commit(frame, {
      dispatch: dispatch,
      lastFocusId: lastFocusId,
      setLastFocusId: function (id) {
        lastFocusId = id;
      },
      getLastFocusId: function () {
        return lastFocusId;
      }
    });
  }

  function scheduleRestTick() {
    if (tickTimer) {
      clearTimeout(tickTimer);
      tickTimer = null;
    }
    if (!state || state.restEndsAt == null) return;
    if (state.phase !== "Resting" && state.menuReturn !== "Resting") return;
    tickTimer = scheduleTick(dispatch, now());
  }

  function firePendingCue() {
    if (state && state.pendingCue === "rest_over") {
      state.pendingCue = null;
      audio.fireCue();
    }
  }

  function dispatch(event) {
    if (!event) return;
    var prevPhase = state && state.phase;
    var t = now();

    if (!state) state = idleState(t);

    var deps = {
      IDEMPOTENCY_MS: IDEMPOTENCY_MS,
      STALE_CUE_MS: STALE_CUE_MS,
      hasEverTaught: hasEverTaught,
      persistTaught: persistTaught,
      MACHINE_IDS: MACHINE_IDS,
      PLANS: PLANS,
      EX: EX,
      MACHINE_DEFAULTS: MACHINE_DEFAULTS,
      LEVEL_MULT: LEVEL_MULT,
      resetPlanTo: resetPlanTo,
      clonePlan: clonePlanFor,
      makeMachinePlan: planApi.makeMachinePlan
    };

    if (event.t === "SELECT_EQUIP" || event.t === "TRAIN_MACHINE") {
      state = reducer(state, event, t, plan, deps);
      if (state.planId) resetPlanTo(state.planId, state.level || "beginner");
      lastFocusId = "primary";
      firePendingCue();
      save();
      paint();
      scheduleRestTick();
      return;
    }

    if (event.t === "SELECT_HOME") {
      state = reducer(state, event, t, plan, deps);
      lastFocusId = state.phase === "MachineList"
        ? "mach_" + MACHINE_IDS[0]
        : "plan_full";
      firePendingCue();
      save();
      paint();
      scheduleRestTick();
      return;
    }

    if (event.t === "SELECT_PLAN") {
      state = reducer(state, event, t, plan, deps);
      lastFocusId = "level_beg";
      firePendingCue();
      save();
      paint();
      scheduleRestTick();
      return;
    }

    if (event.t === "SELECT_LEVEL") {
      state = reducer(state, event, t, plan, deps);
      lastFocusId = "equip_m";
      firePendingCue();
      save();
      paint();
      scheduleRestTick();
      return;
    }

    state = reducer(state, event, t, plan, deps);

    if (state.planId && (!plan || plan.id !== state.planId)) {
      if (PLANS[state.planId] || isMachinePlanId(state.planId)) {
        resetPlanTo(state.planId, state.level || "beginner");
      }
    }

    firePendingCue();

    if (state.phase !== prevPhase) {
      lastFocusId = "primary";
      if (state.phase === "Adjusting") lastFocusId = "minus";
      if (state.phase === "Home") lastFocusId = "mode_train";
      if (state.phase === "PlanSelect") lastFocusId = "plan_full";
      if (state.phase === "LevelSelect") lastFocusId = "level_beg";
      if (state.phase === "EquipSelect") lastFocusId = "equip_m";
      if (state.phase === "MachineList") {
        lastFocusId = "mach_" + MACHINE_IDS[(state.machinePage || 0) * 2];
      }
      if (state.phase === "MachineDetail") lastFocusId = "train_this";
      if (state.phase === "Menu") {
        lastFocusId = state.menuReturn === "Resting" ? "undo"
          : (state.menuReturn === "Summary" ? "quit" : "howto");
      }
      if (state.phase === "QuitConfirm") lastFocusId = "primary";
      save();
    } else if (
      event.t === "ADJUST_DELTA" || event.t === "CONFIRM" ||
      event.t === "TEACH_NEXT" || event.t === "MACHINE_MORE" || event.t === "MACHINE_TIP"
    ) {
      save();
      if (event.t === "MACHINE_MORE") {
        lastFocusId = "mach_" + MACHINE_IDS[(state.machinePage || 0) * 2];
      }
    }

    paint();
    scheduleRestTick();
  }

  function actionButtons() {
    var root = document.getElementById("actions");
    if (!root) return [];
    return Array.prototype.slice.call(root.querySelectorAll(".btn"));
  }

  function boot() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        var buttons = actionButtons();
        var idx = buttons.indexOf(document.activeElement);
        var next = buttons[Math.min(buttons.length - 1, Math.max(0, idx) + 1)] || buttons[0];
        if (next) {
          next.focus();
          lastFocusId = next.dataset.id;
        }
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        var buttons2 = actionButtons();
        var idx2 = buttons2.indexOf(document.activeElement);
        var prev = buttons2[Math.max(0, (idx2 < 0 ? 0 : idx2) - 1)] || buttons2[0];
        if (prev) {
          prev.focus();
          lastFocusId = prev.dataset.id;
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        audio.ensureAudio();
        var focused = document.activeElement;
        if (focused && focused.classList.contains("btn") && focused.closest("#actions")) {
          lastFocusId = focused.dataset.id;
          var handler = focused._spHandler || null;
          if (handler) dispatch(handler);
        } else {
          var first = actionButtons()[0];
          if (first) {
            var firstHandler = first._spHandler || null;
            if (firstHandler) dispatch(firstHandler);
          }
        }
      }
    });

    document.addEventListener("visibilitychange", function () {
      dispatch({ t: "VISIBILITY", visible: !document.hidden });
    });

    var saved = load();
    if (saved && saved.phase && !PRE_WORKOUT[saved.phase]) {
      state = saved;
      state.paused = document.hidden;
      if (state.phase === "Resting" && state.restEndsAt != null && now() >= state.restEndsAt) {
        dispatch({ t: "VISIBILITY", visible: true });
      } else {
        paint();
        scheduleRestTick();
      }
    } else {
      state = idleState(now());
      lastFocusId = "mode_train";
      paint();
    }
  }

  SetPace.boot = boot;
})();