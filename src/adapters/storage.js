/* module: storage (localStorage adapter; schema v2) */
(function () {
  "use strict";

  function save(STORE_KEY, PRE_WORKOUT, state, plan) {
    if (!state || PRE_WORKOUT[state.phase]) {
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      return;
    }
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({
        state: state,
        planId: state.planId,
        level: state.level || "beginner",
        planSetsLen: plan.sets.length
      }));
    } catch (e) {}
  }

  function load(STORE_KEY, deps) {
    var now = deps.now;
    var PLANS = deps.PLANS;
    var EX = deps.EX;
    var LEVEL_MULT = deps.LEVEL_MULT;
    var isMachinePlanId = deps.isMachinePlanId;
    var clonePlan = deps.clonePlan;
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var wrapped = JSON.parse(raw);
      var s = wrapped.state || wrapped;
      if (!s || (s.schemaVersion !== 2 && s.schemaVersion !== 1)) return null;
      if (s.startedAt && now() - s.startedAt > 6 * 60 * 60 * 1000) {
        localStorage.removeItem(STORE_KEY);
        return null;
      }
      var pid = wrapped.planId || s.planId;
      var lvl = wrapped.level || s.level || "beginner";
      if (!pid || (!PLANS[pid] && !isMachinePlanId(pid))) return null;
      if (isMachinePlanId(pid) && !EX[pid.slice(8)]) return null;
      s.level = lvl;
      var plan = clonePlan(pid, lvl);
      var baseLen = plan.sets.length;
      if (PLANS[pid]) baseLen = PLANS[pid].sets.length;
      var extra = (wrapped.planSetsLen || plan.sets.length) - baseLen;
      if (extra > 0) {
        var template = PLANS[pid]
          ? PLANS[pid].sets[PLANS[pid].sets.length - 1]
          : plan.sets[plan.sets.length - 1];
        for (var i = 0; i < extra; i++) {
          plan.sets.push(JSON.parse(JSON.stringify(template)));
          if (plan.sets[plan.sets.length - 1].targetWeightKg != null && lvl === "intermediate") {
            var sw = Math.round(plan.sets[plan.sets.length - 1].targetWeightKg * LEVEL_MULT.intermediate);
            if (sw > 250) sw = 250;
            plan.sets[plan.sets.length - 1].targetWeightKg = sw;
          }
        }
      }
      if (!s.taught) s.taught = [];
      if (s.teachStep == null) s.teachStep = 0;
      if (s.machinePage == null) s.machinePage = 0;
      s.schemaVersion = 2;
      return { state: s, plan: plan };
    } catch (e) { return null; }
  }

  var api = { save: save, load: load };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.storage = api;
})();