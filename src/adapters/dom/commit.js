/* module: commit (keyed DOM diff + focus restore; matches original index.html contract) */
(function () {
  "use strict";

  var appEl = null;
  var eyebrowEl = null;
  var headingEl = null;
  var heroEl = null;
  var metaEl = null;
  var demoWrap = null;
  var progressEl = null;
  var progressFill = null;
  var actionsEl = null;
  var moodClasses = ["teach", "rest", "summary", "active", "ready", "home"];

  var demo = SetPace.api.demo;

  // Lazy init: module load must not touch the DOM (build.mjs validates content
  // in Node). Elements resolve on first commit, which only happens in-browser.
  function init() {
    if (appEl) return;
    appEl = document.getElementById("app");
    eyebrowEl = document.getElementById("eyebrow");
    headingEl = document.getElementById("heading");
    heroEl = document.getElementById("hero");
    metaEl = document.getElementById("meta");
    demoWrap = document.getElementById("demoWrap");
    progressEl = document.getElementById("progress");
    progressFill = document.getElementById("progressFill");
    actionsEl = document.getElementById("actions");
  }

  function commit(frame, ports) {
    init();
    var dispatch = ports.dispatch;
    var lastFocusId = ports.getLastFocusId();

    eyebrowEl.textContent = frame.eyebrow || "";
    headingEl.textContent = frame.heading || "";
    heroEl.textContent = frame.hero || "";
    if (!frame.hero) heroEl.classList.add("empty");
    else heroEl.classList.remove("empty");
    metaEl.textContent = frame.meta || "";

    for (var m = 0; m < moodClasses.length; m++) {
      appEl.classList.remove(moodClasses[m]);
    }
    if (frame.mood) appEl.classList.add(frame.mood);

    if (frame.progress == null) {
      progressEl.classList.remove("on");
    } else {
      progressEl.classList.add("on");
      progressFill.style.width = Math.round(frame.progress * 100) + "%";
    }

    if (frame.demo) {
      demoWrap.classList.add("on");
      demo.startDemo(frame.demo, frame.gif || null);
    } else {
      demoWrap.classList.remove("on");
      demo.stopDemo();
    }

    var existing = {};
    var kids = actionsEl.querySelectorAll(".btn");
    for (var i = 0; i < kids.length; i++) {
      existing[kids[i].dataset.id] = kids[i];
    }

    var keep = {};
    for (var a = 0; a < frame.actions.length; a++) {
      var action = frame.actions[a];
      keep[action.id] = true;
      var btn = existing[action.id];
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn";
        btn.dataset.id = action.id;
        btn.addEventListener("click", function (ev) {
          var id = ev.currentTarget.dataset.id;
          var handler = ev.currentTarget._spHandler;
          if (handler) dispatch(handler);
        });
      }
      btn.textContent = action.label;
      btn.className = "btn" + (a === 0 ? " primary" : "");
      btn._spHandler = action.event;
      if (btn.parentNode !== actionsEl || actionsEl.children[a] !== btn) {
        actionsEl.insertBefore(btn, actionsEl.children[a] || null);
      }
    }

    for (var id in existing) {
      if (!keep[id]) existing[id].remove();
    }

    var focusTarget = actionsEl.querySelector('[data-id="' + lastFocusId + '"]') ||
      actionsEl.querySelector(".btn");
    if (focusTarget) {
      focusTarget.focus();
      ports.setLastFocusId(focusTarget.dataset.id);
    }
  }

  var api = { commit: commit };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.commit = api;
})();