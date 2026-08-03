/* module: validatePlan */
(function () {
  "use strict";

  // Content contract (brief §5.D): name <= 18, cue <= 28, steps <= 28.
  // Never truncate on-device as the primary strategy — fail the build instead.
  var LIMITS = {
    name: 18,
    cue: 28,
    step: 28
  };

  function validatePlan(plan, EX) {
    var errors = [];
    if (!plan || typeof plan !== "object") {
      return ["plan is not an object"];
    }
    if (!plan.id || typeof plan.id !== "string") {
      errors.push("plan.id missing");
    }
    if (!plan.name || plan.name.length > LIMITS.name) {
      errors.push("plan '" + (plan.id || "?") + "' name over " + LIMITS.name + " chars: '" + plan.name + "'");
    }
    if (!plan.exercises || typeof plan.exercises !== "object") {
      errors.push("plan '" + (plan.id || "?") + "' exercises missing");
    }
    if (!Array.isArray(plan.sets) || plan.sets.length === 0) {
      errors.push("plan '" + (plan.id || "?") + "' sets empty");
    }

    // Every set must reference a known exercise with valid content.
    var sets = plan.sets || [];
    for (var i = 0; i < sets.length; i++) {
      var set = sets[i];
      if (!set || typeof set !== "object") {
        errors.push("plan '" + (plan.id || "?") + "' set " + i + " invalid");
        continue;
      }
      var ex = plan.exercises && plan.exercises[set.exerciseId];
      if (!ex) {
        errors.push("plan '" + (plan.id || "?") + "' set " + i + " references unknown exercise '" + set.exerciseId + "'");
        continue;
      }
      if (!ex.name || ex.name.length > LIMITS.name) {
        errors.push("exercise '" + set.exerciseId + "' name over " + LIMITS.name + " chars");
      }
      if (ex.cue && ex.cue.length > LIMITS.cue) {
        errors.push("exercise '" + set.exerciseId + "' cue over " + LIMITS.cue + " chars");
      }
      if (Array.isArray(ex.steps)) {
        for (var s = 0; s < ex.steps.length; s++) {
          if (ex.steps[s].length > LIMITS.step) {
            errors.push("exercise '" + set.exerciseId + "' step " + s + " over " + LIMITS.step + " chars");
          }
        }
      }
      if (typeof set.targetReps !== "number" || set.targetReps < 1) {
        errors.push("plan '" + (plan.id || "?") + "' set " + i + " targetReps invalid");
      }
      if (set.targetWeightKg != null && (typeof set.targetWeightKg !== "number" || set.targetWeightKg < 0 || set.targetWeightKg > 250)) {
        errors.push("plan '" + (plan.id || "?") + "' set " + i + " targetWeightKg out of range (0-250 kg)");
      }
      if (typeof set.restSec !== "number" || set.restSec < 0) {
        errors.push("plan '" + (plan.id || "?") + "' set " + i + " restSec invalid");
      }
    }
    return errors;
  }

  function validateAll(PLANS, EX) {
    var all = [];
    for (var id in PLANS) {
      all = all.concat(validatePlan(PLANS[id], EX));
    }
    return all;
  }

  var api = {
    LIMITS: LIMITS,
    validatePlan: validatePlan,
    validateAll: validateAll
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.validatePlan = api;
})();