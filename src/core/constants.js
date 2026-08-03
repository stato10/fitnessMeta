/* module: constants */
(function () {
  "use strict";

  // Exercise library (cue <= 28, steps <= 28, name <= 18). Mirrors index.html v2.5k.
  var EX = {
    legpress: {
      id: "legpress", name: "Leg press", unit: "kg",
      trains: "Quads · glutes",
      cue: "Machine · adjust seat",
      demo: "legpress",
      gif: "media/legpress.gif",
      steps: [
        "Sit · back flat",
        "Feet mid platform",
        "Unlock the sled",
        "Press legs out",
        "Bend knees control"
      ]
    },
    chestpress: {
      id: "chestpress", name: "Chest press", unit: "kg",
      trains: "Chest · triceps",
      cue: "Machine · seat height",
      demo: "chestpress",
      gif: "media/chestpress.gif",
      steps: [
        "Sit · back on pad",
        "Handles at chest",
        "Elbows ~90 deg",
        "Press arms out",
        "Return slow"
      ]
    },
    latpulldown: {
      id: "latpulldown", name: "Lat pulldown", unit: "kg",
      trains: "Lats · upper back",
      cue: "Cable · high bar",
      demo: "latpulldown",
      gif: "media/latpulldown.gif",
      steps: [
        "Sit · thighs pinned",
        "Wide overhand grip",
        "Chest up slightly",
        "Pull bar to chest",
        "Raise arms slow"
      ]
    },
    shpress: {
      id: "shpress", name: "Shoulder press", unit: "kg",
      trains: "Shoulders · triceps",
      cue: "Machine · seat up",
      demo: "shpress",
      gif: "media/shpress.gif",
      steps: [
        "Sit · back supported",
        "Handles at shoulders",
        "Press up overhead",
        "Do not lock hard",
        "Lower with control"
      ]
    },
    cablecurl: {
      id: "cablecurl", name: "Cable curl", unit: "kg",
      trains: "Biceps",
      cue: "Cable · low pulley",
      demo: "cablecurl",
      gif: "media/cablecurl.gif",
      steps: [
        "Face low cable",
        "Underhand grip",
        "Elbows pinned in",
        "Curl to shoulders",
        "Lower slow"
      ]
    },
    plank: {
      id: "plank", name: "Plank", unit: "time",
      trains: "Core",
      cue: "Floor · brace hard",
      demo: "plank",
      gif: "media/plank.gif",
      steps: [
        "Forearms under shoulders",
        "Toes on floor",
        "Body in one line",
        "Brace abs hard",
        "Hold the time"
      ]
    },
    incline: {
      id: "incline", name: "Incline press", unit: "kg",
      trains: "Upper chest · shoulders",
      cue: "Machine · slight up",
      demo: "incline",
      gif: "media/incline.gif",
      steps: [
        "Sit · back on pad",
        "Handles at chest",
        "Press up and out",
        "Stop short of lock",
        "Lower slow"
      ]
    },
    tripush: {
      id: "tripush", name: "Tricep pushdown", unit: "kg",
      trains: "Triceps",
      cue: "Cable · high pulley",
      demo: "tripush",
      gif: "media/tripush.gif",
      steps: [
        "Stand at high cable",
        "Grip bar / rope",
        "Elbows pinned in",
        "Push down to hips",
        "Return slow"
      ]
    },
    legcurl: {
      id: "legcurl", name: "Leg curl", unit: "kg",
      trains: "Hamstrings",
      cue: "Machine · pad calves",
      demo: "legcurl",
      gif: "media/legcurl.gif",
      steps: [
        "Lie face down",
        "Pad on lower legs",
        "Curl heels to glutes",
        "Squeeze hamstrings",
        "Lower slow"
      ]
    },
    legext: {
      id: "legext", name: "Leg extension", unit: "kg",
      trains: "Quads",
      cue: "Machine · pad shins",
      demo: "legext",
      gif: "media/legext.gif",
      steps: [
        "Sit · back flat",
        "Pad on lower shins",
        "Extend knees out",
        "Do not snap lock",
        "Lower control"
      ]
    },
    calfraise: {
      id: "calfraise", name: "Calf raise", unit: "kg",
      trains: "Calves",
      cue: "Machine · toes edge",
      demo: "calfraise",
      gif: "media/calfraise.gif",
      steps: [
        "Shoulders under pads",
        "Balls of feet on edge",
        "Rise onto toes",
        "Pause at top",
        "Lower heels slow"
      ]
    },
    bwsquat: {
      id: "bwsquat", name: "BW squat", unit: "bodyweight",
      cue: "Floor · own weight",
      demo: "bwsquat",
      gif: "media/bwsquat.gif",
      steps: [
        "Feet shoulder wide",
        "Chest up · brace",
        "Sit hips back",
        "Thighs near parallel",
        "Drive up tall"
      ]
    },
    gobletsquat: {
      id: "gobletsquat", name: "Goblet squat", unit: "kg",
      cue: "Dumbbell · at chest",
      demo: "gobletsquat",
      gif: "media/gobletsquat.gif",
      steps: [
        "Hold DB at chest",
        "Feet shoulder wide",
        "Sit hips back",
        "Elbows inside knees",
        "Drive up tall"
      ]
    },
    bbbench: {
      id: "bbbench", name: "Bench press", unit: "kg",
      cue: "Barbell · flat bench",
      demo: "bbbench",
      gif: "media/bbbench.gif",
      steps: [
        "Lie · feet planted",
        "Grip outside shoulders",
        "Unrack over chest",
        "Lower to mid chest",
        "Press up control"
      ]
    },
    bentrow: {
      id: "bentrow", name: "Bent-over row", unit: "kg",
      cue: "Barbell · hinge",
      demo: "bentrow",
      gif: "media/bentrow.gif",
      steps: [
        "Hinge · back flat",
        "Bar hangs at shins",
        "Pull to lower ribs",
        "Squeeze shoulder blades",
        "Lower slow"
      ]
    },
    dbohp: {
      id: "dbohp", name: "DB shoulder press", unit: "kg",
      cue: "Dumbbells · seated",
      demo: "dbohp",
      gif: "media/dbohp.gif",
      steps: [
        "Sit · core braced",
        "DBs at shoulders",
        "Press up overhead",
        "Do not flare ribs",
        "Lower with control"
      ]
    },
    dbcurl: {
      id: "dbcurl", name: "DB curl", unit: "kg",
      cue: "Dumbbells · stand",
      demo: "dbcurl",
      gif: "media/dbcurl.gif",
      steps: [
        "Stand · elbows in",
        "Palms forward",
        "Curl to shoulders",
        "Keep elbows still",
        "Lower slow"
      ]
    },
    rdl: {
      id: "rdl", name: "Romanian DL", unit: "kg",
      cue: "Barbell · soft knees",
      demo: "rdl",
      gif: "media/rdl.gif",
      steps: [
        "Soft knees · brace",
        "Hinge hips back",
        "Bar close to legs",
        "Feel hamstrings",
        "Stand squeeze glutes"
      ]
    },
    dblunge: {
      id: "dblunge", name: "DB lunge", unit: "kg",
      cue: "Dumbbells · at sides",
      demo: "dblunge",
      gif: "media/dblunge.gif",
      steps: [
        "Step one foot forward",
        "Both knees ~90 deg",
        "Front knee tracks toe",
        "Push back to stand",
        "Alternate legs"
      ]
    },
    dbincpress: {
      id: "dbincpress", name: "DB incline press", unit: "kg",
      cue: "Dumbbells · incline",
      demo: "dbincpress",
      gif: "media/dbincpress.gif",
      steps: [
        "Bench slight incline",
        "DBs at chest line",
        "Press up and in",
        "Stop short of bang",
        "Lower slow"
      ]
    },
    kickback: {
      id: "kickback", name: "Tricep kickback", unit: "kg",
      cue: "Dumbbell · hinge",
      demo: "kickback",
      gif: "media/kickback.gif",
      steps: [
        "Hinge · elbow high",
        "Upper arm still",
        "Extend forearm back",
        "Squeeze tricep",
        "Return slow"
      ]
    },
    dbcalf: {
      id: "dbcalf", name: "DB calf raise", unit: "kg",
      cue: "Dumbbells · stand",
      demo: "dbcalf",
      gif: "media/dbcalf.gif",
      steps: [
        "Hold DBs at sides",
        "Rise onto toes",
        "Pause at top",
        "Lower heels slow",
        "Keep ankles steady"
      ]
    }
  };

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

  var PLANS = {
    fullbody: {
      id: "fullbody",
      name: "Full body",
      exercises: {
        legpress: EX.legpress,
        chestpress: EX.chestpress,
        latpulldown: EX.latpulldown,
        shpress: EX.shpress,
        cablecurl: EX.cablecurl,
        plank: EX.plank
      },
      sets: []
        .concat(setsOf("legpress", 10, 40, 2, { mid: 90, last: 90 }))
        .concat(setsOf("chestpress", 10, 20, 2, { mid: 90, last: 90 }))
        .concat(setsOf("latpulldown", 10, 25, 2, { mid: 75, last: 75 }))
        .concat(setsOf("shpress", 10, 15, 2, { mid: 75, last: 75 }))
        .concat(setsOf("cablecurl", 12, 12, 2, { mid: 60, last: 60 }))
        .concat(setsOf("plank", 30, null, 2, { mid: 45, last: 0 }))
    },
    upper: {
      id: "upper",
      name: "Upper push",
      exercises: {
        chestpress: EX.chestpress,
        shpress: EX.shpress,
        incline: EX.incline,
        tripush: EX.tripush
      },
      sets: []
        .concat(setsOf("chestpress", 10, 25, 3, { mid: 90, last: 90 }))
        .concat(setsOf("shpress", 10, 15, 3, { mid: 90, last: 75 }))
        .concat(setsOf("incline", 10, 20, 3, { mid: 75, last: 75 }))
        .concat(setsOf("tripush", 12, 20, 3, { mid: 60, last: 0 }))
    },
    legs: {
      id: "legs",
      name: "Legs",
      exercises: {
        legpress: EX.legpress,
        legcurl: EX.legcurl,
        legext: EX.legext,
        calfraise: EX.calfraise,
        bwsquat: EX.bwsquat
      },
      sets: []
        .concat(setsOf("legpress", 10, 40, 3, { mid: 90, last: 90 }))
        .concat(setsOf("legcurl", 12, 25, 3, { mid: 75, last: 75 }))
        .concat(setsOf("legext", 12, 25, 3, { mid: 75, last: 75 }))
        .concat(setsOf("calfraise", 15, 30, 3, { mid: 60, last: 60 }))
        .concat(setsOf("bwsquat", 12, null, 2, { mid: 60, last: 0 }))
    },
    fullbody_free: {
      id: "fullbody_free",
      name: "Full body · free",
      exercises: {
        gobletsquat: EX.gobletsquat,
        bbbench: EX.bbbench,
        bentrow: EX.bentrow,
        dbohp: EX.dbohp,
        dbcurl: EX.dbcurl,
        plank: EX.plank
      },
      sets: []
        .concat(setsOf("gobletsquat", 10, 16, 2, { mid: 90, last: 90 }))
        .concat(setsOf("bbbench", 8, 30, 2, { mid: 90, last: 90 }))
        .concat(setsOf("bentrow", 10, 30, 2, { mid: 75, last: 75 }))
        .concat(setsOf("dbohp", 10, 10, 2, { mid: 75, last: 75 }))
        .concat(setsOf("dbcurl", 12, 8, 2, { mid: 60, last: 60 }))
        .concat(setsOf("plank", 30, null, 2, { mid: 45, last: 0 }))
    },
    upper_free: {
      id: "upper_free",
      name: "Upper · free",
      exercises: {
        bbbench: EX.bbbench,
        dbohp: EX.dbohp,
        dbincpress: EX.dbincpress,
        kickback: EX.kickback
      },
      sets: []
        .concat(setsOf("bbbench", 8, 35, 3, { mid: 90, last: 90 }))
        .concat(setsOf("dbohp", 10, 10, 3, { mid: 90, last: 75 }))
        .concat(setsOf("dbincpress", 10, 14, 3, { mid: 75, last: 75 }))
        .concat(setsOf("kickback", 12, 6, 3, { mid: 60, last: 0 }))
    },
    legs_free: {
      id: "legs_free",
      name: "Legs · free",
      exercises: {
        gobletsquat: EX.gobletsquat,
        rdl: EX.rdl,
        dblunge: EX.dblunge,
        dbcalf: EX.dbcalf,
        bwsquat: EX.bwsquat
      },
      sets: []
        .concat(setsOf("gobletsquat", 10, 16, 3, { mid: 90, last: 90 }))
        .concat(setsOf("rdl", 8, 40, 3, { mid: 90, last: 90 }))
        .concat(setsOf("dblunge", 10, 10, 3, { mid: 75, last: 75 }))
        .concat(setsOf("dbcalf", 15, 12, 3, { mid: 60, last: 60 }))
        .concat(setsOf("bwsquat", 12, null, 2, { mid: 60, last: 0 }))
    }
  };

  var STORE_KEY = "setpace_session_v2";
  var TAUGHT_KEY = "setpace_taught_v1";
  var IDEMPOTENCY_MS = 250;
  var STALE_CUE_MS = 30000;
  var LEVEL_MULT = { beginner: 1, intermediate: 1.35 };
  // Full catalog: every exercise with a matched GIF demo
  var MACHINE_IDS = [
    "legpress", "chestpress", "latpulldown", "shpress", "cablecurl",
    "incline", "tripush", "legcurl", "legext", "calfraise",
    "gobletsquat", "bbbench", "bentrow", "dbohp", "dbcurl",
    "rdl", "dblunge", "dbincpress", "kickback", "dbcalf",
    "bwsquat", "plank"
  ];
  var MACHINE_DEFAULTS = {
    legpress: { reps: 10, kg: 40 },
    chestpress: { reps: 10, kg: 20 },
    latpulldown: { reps: 10, kg: 25 },
    shpress: { reps: 10, kg: 15 },
    cablecurl: { reps: 12, kg: 12 },
    incline: { reps: 10, kg: 20 },
    tripush: { reps: 12, kg: 20 },
    legcurl: { reps: 12, kg: 25 },
    legext: { reps: 12, kg: 25 },
    calfraise: { reps: 15, kg: 30 },
    gobletsquat: { reps: 10, kg: 16 },
    bbbench: { reps: 8, kg: 30 },
    bentrow: { reps: 10, kg: 30 },
    dbohp: { reps: 10, kg: 10 },
    dbcurl: { reps: 12, kg: 8 },
    rdl: { reps: 8, kg: 40 },
    dblunge: { reps: 10, kg: 10 },
    dbincpress: { reps: 10, kg: 14 },
    kickback: { reps: 12, kg: 6 },
    dbcalf: { reps: 15, kg: 12 },
    bwsquat: { reps: 12, kg: null },
    plank: { reps: 30, kg: null }
  };
  var PRE_WORKOUT = {
    Home: 1, Idle: 1, PlanSelect: 1, LevelSelect: 1,
    EquipSelect: 1, MachineList: 1, MachineDetail: 1
  };

  var api = {
    EX: EX,
    PLANS: PLANS,
    STORE_KEY: STORE_KEY,
    TAUGHT_KEY: TAUGHT_KEY,
    IDEMPOTENCY_MS: IDEMPOTENCY_MS,
    STALE_CUE_MS: STALE_CUE_MS,
    LEVEL_MULT: LEVEL_MULT,
    MACHINE_IDS: MACHINE_IDS,
    MACHINE_DEFAULTS: MACHINE_DEFAULTS,
    PRE_WORKOUT: PRE_WORKOUT
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.constants = api;
})();