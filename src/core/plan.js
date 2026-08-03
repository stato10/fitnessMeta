/* module: plan */
(function () {
  "use strict";

  function isMachinePlanId(id) {
    return !!(id && id.indexOf("machine_") === 0);
  }

  function scalePlanWeights(plan, level, LEVEL_MULT) {
    var mult = LEVEL_MULT[level] || 1;
    if (mult === 1) return plan;
    for (var i = 0; i < plan.sets.length; i++) {
      var kg = plan.sets[i].targetWeightKg;
      if (kg == null) continue;
      var scaled = Math.round(kg * mult);
      if (scaled < 1) scaled = 1;
      if (scaled > 250) scaled = 250;
      plan.sets[i].targetWeightKg = scaled;
    }
    return plan;
  }

  function makeMachinePlan(EX, MACHINE_DEFAULTS, LEVEL_MULT, exId, level) {
    var ex = EX[exId];
    if (!ex) return null;
    var def = MACHINE_DEFAULTS[exId] || { reps: 10, kg: 20 };
    var exercises = {};
    exercises[exId] = JSON.parse(JSON.stringify(ex));
    var plan = {
      id: "machine_" + exId,
      name: ex.name,
      exercises: exercises,
      sets: setsOf(exId, def.reps, def.kg, 2, { mid: 90, last: 0 })
    };
    return scalePlanWeights(plan, level || "beginner", LEVEL_MULT);
  }

  function setsOf(exId, reps, kg, n, rest) {
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push({
        exerciseId: exId,
        targetReps: reps,
        targetWeightKg: kg,
        restSec: i === n - 1 ? rest.last : rest.mid
      });
    }
    return out;
  }

  function clonePlan(PLANS, EX, MACHINE_DEFAULTS, LEVEL_MULT, id, level) {
    if (isMachinePlanId(id)) {
      return makeMachinePlan(EX, MACHINE_DEFAULTS, LEVEL_MULT, id.slice(8), level);
    }
    var plan = JSON.parse(JSON.stringify(PLANS[id]));
    return scalePlanWeights(plan, level || "beginner", LEVEL_MULT);
  }

  function exerciseOf(plan, set) {
    return plan.exercises[set.exerciseId];
  }

  function setProgress(plan, cursor) {
    var set = plan.sets[cursor];
    if (!set) return { current: 0, total: 0 };
    var total = 0;
    var current = 0;
    for (var i = 0; i < plan.sets.length; i++) {
      if (plan.sets[i].exerciseId === set.exerciseId) {
        total++;
        if (i <= cursor) current++;
      }
    }
    return { current: current, total: total };
  }

  function formatWeight(kg) {
    if (kg == null) return "";
    return (kg % 1 === 0 ? String(kg) : kg.toFixed(1)) + " kg";
  }

  function formatClock(sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function heroForSet(set, reps, ex) {
    if (ex && ex.unit === "time") return formatClock(reps);
    if (ex && ex.unit === "bodyweight") return reps + " reps";
    var w = formatWeight(set.targetWeightKg);
    return w ? w + " kg · " + reps : reps + " reps";
  }

  var api = {
    isMachinePlanId: isMachinePlanId,
    scalePlanWeights: scalePlanWeights,
    makeMachinePlan: makeMachinePlan,
    clonePlan: clonePlan,
    exerciseOf: exerciseOf,
    setProgress: setProgress,
    formatWeight: formatWeight,
    formatClock: formatClock,
    heroForSet: heroForSet
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.plan = api;
})();