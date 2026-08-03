/* module: render (pure → Frame; no DOM/Date.now/localStorage) */
(function () {
  "use strict";

  var NAV_ACTIONS = { plan_full: 1, plan_upper: 1, plan_legs: 1, more: 1, back: 1, tip: 1, skip: 1, plus: 1, add: 1, quit: 1, howto: 1, menu: 1 };

  function workoutProgress(state, plan) {
    if (!state || !plan || !plan.sets.length) return 0;
    return Math.min(1, state.logged.length / plan.sets.length);
  }

  function render(state, t, plan, deps) {
    deps = deps || {};
    var exerciseOf = deps.exerciseOf;
    var setProgress = deps.setProgress;
    var formatClock = deps.formatClock;
    var heroForSet = deps.heroForSet;
    var MACHINE_IDS = deps.MACHINE_IDS;
    var EX = deps.EX;

    if (!state || state.phase === "Home" || state.phase === "Idle") {
      return {
        eyebrow: "SETPACE",
        heading: "Let's train",
        hero: "",
        meta: "Train without the phone",
        demo: null,
        progress: null,
        mood: "home",
        actions: [
          { id: "mode_train", label: "Train", event: { t: "SELECT_HOME", mode: "train" } },
          { id: "mode_machines", label: "Exercises", event: { t: "SELECT_HOME", mode: "machines" } }
        ]
      };
    }

    if (state.phase === "PlanSelect") {
      return {
        eyebrow: "Train",
        heading: "What today?",
        hero: "",
        meta: "Pick a focus",
        demo: null,
        progress: null,
        mood: "home",
        actions: [
          { id: "plan_full", label: "Full body", event: { t: "SELECT_PLAN", planId: "fullbody" } },
          { id: "plan_upper", label: "Upper push", event: { t: "SELECT_PLAN", planId: "upper" } },
          { id: "plan_legs", label: "Legs", event: { t: "SELECT_PLAN", planId: "legs" } }
        ]
      };
    }

    if (state.phase === "LevelSelect") {
      var g0 = state.pendingGoal || "fullbody";
      var g0Label = g0 === "upper" ? "Upper" : (g0 === "legs" ? "Legs" : "Full body");
      return {
        eyebrow: g0Label,
        heading: "Level?",
        hero: "",
        meta: "Sets your starting weights",
        demo: null,
        progress: null,
        mood: "home",
        actions: [
          { id: "level_beg", label: "Beginner", event: { t: "SELECT_LEVEL", level: "beginner" } },
          { id: "level_int", label: "Intermediate", event: { t: "SELECT_LEVEL", level: "intermediate" } },
          { id: "back", label: "Back", event: { t: "BACK" } }
        ]
      };
    }

    if (state.phase === "EquipSelect") {
      var g = state.pendingGoal || "fullbody";
      var gLabel = g === "upper" ? "Upper" : (g === "legs" ? "Legs" : "Full body");
      var lvlTag = state.level === "intermediate" ? " · Intermediate" : " · Beginner";
      return {
        eyebrow: gLabel + lvlTag,
        heading: "Equipment?",
        hero: "",
        meta: "Machines or free weights",
        demo: null,
        progress: null,
        mood: "home",
        actions: [
          { id: "equip_m", label: "Machines", event: { t: "SELECT_EQUIP", equip: "machine" } },
          { id: "equip_f", label: "Free weights", event: { t: "SELECT_EQUIP", equip: "free" } },
          { id: "back", label: "Back", event: { t: "BACK" } }
        ]
      };
    }

    if (state.phase === "MachineList") {
      var page = state.machinePage || 0;
      var start = page * 2;
      var pair = MACHINE_IDS.slice(start, start + 2);
      var hasMore = start + 2 < MACHINE_IDS.length;
      var mActions = [];
      for (var mi = 0; mi < pair.length; mi++) {
        var mid = pair[mi];
        mActions.push({
          id: "mach_" + mid,
          label: EX[mid].name,
          event: { t: "SELECT_MACHINE", machineId: mid }
        });
      }
      if (hasMore) {
        mActions.push({ id: "more", label: "More", event: { t: "MACHINE_MORE" } });
      } else {
        mActions.push({ id: "back", label: "Back", event: { t: "BACK" } });
      }
      return {
        eyebrow: "Exercises",
        heading: "Pick an exercise",
        hero: "",
        meta: "See the demo · then train it",
        demo: null,
        progress: null,
        mood: "home",
        actions: mActions
      };
    }

    if (state.phase === "MachineDetail") {
      var dex = EX[state.machineId];
      if (!dex) {
        return {
          eyebrow: "Exercises",
          heading: "Not found",
          hero: "",
          meta: "",
          demo: null,
          gif: null,
          progress: null,
          mood: "home",
          actions: [{ id: "back", label: "Back", event: { t: "BACK" } }]
        };
      }
      var dsteps = dex.steps || [];
      var didx = Math.min(state.teachStep || 0, Math.max(0, dsteps.length - 1));
      var dActions = [
        { id: "train_this", label: "Train this", event: { t: "TRAIN_MACHINE" } }
      ];
      if (dsteps.length > 1) {
        dActions.push({ id: "tip", label: "Next tip", event: { t: "MACHINE_TIP" } });
      }
      dActions.push({ id: "back", label: "Back", event: { t: "BACK" } });
      return {
        eyebrow: dex.trains || dex.cue || "Exercise",
        heading: dex.name,
        hero: dsteps[didx] || dex.cue || "",
        meta: (dex.cue || "Setup tip") + (dsteps.length ? " · " + (didx + 1) + "/" + dsteps.length : ""),
        demo: dex.demo || dex.id,
        gif: dex.gif || null,
        progress: null,
        mood: "teach",
        actions: dActions
      };
    }

    if (state.phase === "Menu") {
      var fromRest = state.menuReturn === "Resting";
      var fromSummary = state.menuReturn === "Summary";
      var actions = [];
      if (fromRest) {
        actions.push({ id: "undo", label: "Undo set", event: { t: "UNDO" } });
      } else if (!fromSummary) {
        actions.push({ id: "howto", label: "How to?", event: { t: "HOW_TO" } });
      }
      actions.push({ id: "quit", label: "End workout", event: { t: "QUIT_ASK" } });
      actions.push({ id: "back", label: "Back", event: { t: "BACK" } });
      return {
        eyebrow: "Menu",
        heading: "Options",
        hero: "",
        meta: fromRest ? "Rest keeps counting" : "Quick actions",
        demo: null,
        progress: workoutProgress(state, plan),
        mood: "home",
        actions: actions
      };
    }

    if (state.phase === "QuitConfirm") {
      return {
        eyebrow: "Leave workout?",
        heading: "End now?",
        hero: "",
        meta: "Progress will be cleared",
        demo: null,
        progress: workoutProgress(state, plan),
        mood: "home",
        actions: [
          { id: "primary", label: "Keep going", event: { t: "BACK" } },
          { id: "quit", label: "End workout", event: { t: "QUIT_CONFIRM" } }
        ]
      };
    }

    var pct = workoutProgress(state, plan);

    if (state.phase === "Teach") {
      var tset = plan.sets[state.cursor];
      var tex = exerciseOf(plan, tset);
      var steps = tex.steps || [];
      var idx = Math.min(state.teachStep, Math.max(0, steps.length - 1));
      var last = idx >= steps.length - 1;
      return {
        eyebrow: "Learn · " + (idx + 1) + "/" + steps.length,
        heading: tex.name,
        hero: steps[idx] || "",
        meta: tex.cue || "Follow the motion",
        demo: tex.demo || tex.id,
        gif: tex.gif || null,
        progress: pct,
        mood: "teach",
        actions: [
          { id: "primary", label: last ? "Let's go" : "Next", event: { t: "TEACH_NEXT" } },
          { id: "skip", label: "I know this", event: { t: "TEACH_SKIP" } }
        ]
      };
    }

    if (state.phase === "Adjusting") {
      var aset = plan.sets[state.cursor];
      var aex = exerciseOf(plan, aset);
      return {
        eyebrow: "Adjust",
        heading: aex.name,
        hero: String(state.adjust.reps) + (aex.unit === "time" ? " sec" : " reps"),
        meta: "Change then confirm",
        demo: null,
        progress: pct,
        mood: "ready",
        actions: [
          { id: "minus", label: "−1", event: { t: "ADJUST_DELTA", delta: -1 } },
          { id: "plus", label: "+1", event: { t: "ADJUST_DELTA", delta: 1 } },
          { id: "done", label: "Save", event: { t: "CONFIRM" } }
        ]
      };
    }

    if (state.phase === "Summary") {
      var volume = 0;
      for (var i = 0; i < state.logged.length; i++) {
        var L = state.logged[i];
        if (L.actualWeightKg != null) volume += L.actualWeightKg * L.actualReps;
      }
      var mins = Math.max(1, Math.round((t - state.startedAt) / 60000));
      return {
        eyebrow: "Done",
        heading: "Session complete",
        hero: state.logged.length + " sets",
        meta: mins + " min · " + Math.round(volume) + " kg",
        demo: null,
        progress: 1,
        mood: "summary",
        actions: [
          { id: "primary", label: "Home", event: { t: "FINISH" } },
          { id: "add", label: "Add set", event: { t: "ADD_SET" } }
        ]
      };
    }

    if (state.phase === "Resting") {
      var remain = Math.max(0, Math.ceil((state.restEndsAt - t) / 1000));
      var next = plan.sets[state.cursor];
      var nex = exerciseOf(plan, next);
      var nprog = setProgress(plan, state.cursor);
      var urgent = remain <= 10;
      var restMeta = urgent
        ? "Get ready · " + nex.name
        : "Next: " + nex.name + " · " + nprog.current + "/" + nprog.total;
      return {
        eyebrow: urgent ? "Almost there" : "Rest · breathe",
        heading: nex.name,
        hero: formatClock(remain),
        meta: restMeta,
        demo: null,
        progress: pct,
        mood: "rest",
        urgent: urgent,
        actions: [
          { id: "primary", label: "Skip rest", event: { t: "PRIMARY" } },
          { id: "menu", label: "Menu", event: { t: "OPEN_MENU" } }
        ]
      };
    }

    var set = plan.sets[state.cursor];
    var ex = exerciseOf(plan, set);
    var prog = setProgress(plan, state.cursor);
    var reps = state.adjust ? state.adjust.reps : set.targetReps;
    var hero = heroForSet(set, reps, ex);

    if (state.phase === "SetActive") {
      return {
        eyebrow: "Set " + prog.current + "/" + prog.total + " · working",
        heading: ex.name,
        hero: hero,
        meta: "Tap when finished",
        demo: null,
        progress: pct,
        mood: "active",
        actions: [{ id: "primary", label: "Done", event: { t: "PRIMARY" } }]
      };
    }

    return {
      eyebrow: "Set " + prog.current + "/" + prog.total,
      heading: ex.name,
      hero: hero,
      meta: ex.cue || "Ready when you are",
      demo: null,
      progress: pct,
      mood: "ready",
      actions: [
        { id: "primary", label: "Start set", event: { t: "PRIMARY" } },
        { id: "menu", label: "Menu", event: { t: "OPEN_MENU" } }
      ]
    };
  }

  function defaultFocusId(state, frame) {
    if (!frame || !frame.actions || !frame.actions.length) return null;
    var first = frame.actions[0].id;
    if (state.phase === "Adjusting") return "minus";
    if (NAV_ACTIONS[first]) return first;
    return first;
  }

  var api = {
    workoutProgress: workoutProgress,
    render: render,
    defaultFocusId: defaultFocusId
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.render = api;
})();