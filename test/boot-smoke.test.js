/* boot-smoke.test.js — load the full module graph + app and assert boot paints.
 *
 * Catches API-wiring mistakes (e.g. calling SetPace.api.commit as a function)
 * that pure reducer tests and the build size gate cannot see.
 */
"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const SRC = resolve(__dirname, "..", "src");

const MODULES = [
  "core/constants.js",
  "core/plan.js",
  "core/validatePlan.js",
  "core/reducer.js",
  "core/render.js",
  "adapters/clock.js",
  "adapters/audio.js",
  "adapters/storage.js",
  "adapters/taught.js",
  "adapters/dom/demo.js",
  "adapters/dom/commit.js"
];

function hasClass(el, c) {
  return String(el.className || "")
    .split(/\s+/)
    .filter(Boolean)
    .indexOf(c) !== -1;
}

function makeEl(tag, id) {
  const el = {
    tagName: String(tag || "div").toUpperCase(),
    id: id || "",
    textContent: "",
    className: "",
    dataset: {},
    style: {},
    children: [],
    parentNode: null,
    _spHandler: null,
    classList: {
      add(c) {
        if (!hasClass(el, c)) el.className = (el.className + " " + c).trim();
      },
      remove(c) {
        el.className = String(el.className || "")
          .split(/\s+/)
          .filter((x) => x && x !== c)
          .join(" ");
      },
      contains(c) { return hasClass(el, c); }
    },
    focus() { document.activeElement = el; },
    addEventListener() {},
    remove() {
      if (!el.parentNode) return;
      const kids = el.parentNode.children;
      const i = kids.indexOf(el);
      if (i >= 0) kids.splice(i, 1);
      el.parentNode = null;
    },
    querySelector(sel) {
      if (sel === ".btn") return el.children.find((c) => hasClass(c, "btn")) || null;
      const m = /^\[data-id="([^"]+)"\]$/.exec(sel);
      if (m) return el.children.find((c) => c.dataset.id === m[1]) || null;
      return null;
    },
    querySelectorAll(sel) {
      if (sel === ".btn") return el.children.filter((c) => hasClass(c, "btn"));
      return [];
    },
    closest(sel) {
      if (sel === "#actions" && el.id === "actions") return el;
      let p = el.parentNode;
      while (p) {
        if (sel === "#actions" && p.id === "actions") return p;
        p = p.parentNode;
      }
      return null;
    },
    insertBefore(node, ref) {
      node.parentNode = el;
      if (!ref) {
        el.children.push(node);
        return node;
      }
      const i = el.children.indexOf(ref);
      if (i < 0) el.children.push(node);
      else el.children.splice(i, 0, node);
      return node;
    }
  };
  return el;
}

function installDom() {
  const byId = {
    app: makeEl("div", "app"),
    eyebrow: makeEl("div", "eyebrow"),
    heading: makeEl("div", "heading"),
    hero: makeEl("div", "hero"),
    meta: makeEl("div", "meta"),
    demoWrap: makeEl("div", "demoWrap"),
    progress: makeEl("div", "progress"),
    progressFill: makeEl("i", "progressFill"),
    actions: makeEl("div", "actions"),
    demo: Object.assign(makeEl("canvas", "demo"), {
      width: 280,
      height: 210,
      getContext() {
        return {
          clearRect() {},
          beginPath() {},
          arc() {},
          moveTo() {},
          lineTo() {},
          stroke() {},
          fill() {},
          set lineCap(_) {},
          set lineJoin(_) {},
          set strokeStyle(_) {},
          set fillStyle(_) {},
          set lineWidth(_) {},
          set globalAlpha(_) {}
        };
      }
    }),
    demoGif: Object.assign(makeEl("img", "demoGif"), {
      src: "",
      getAttribute(n) { return n === "src" ? this.src : null; },
      removeAttribute(n) { if (n === "src") this.src = ""; },
      setAttribute(n, v) { if (n === "src") this.src = v; }
    }),
    demoCredit: makeEl("div", "demoCredit"),
    flash: makeEl("div", "flash"),
    error: makeEl("pre", "error")
  };

  const store = {};
  global.localStorage = {
    getItem(k) { return k in store ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; }
  };

  global.document = {
    hidden: false,
    activeElement: null,
    getElementById(id) { return byId[id] || null; },
    querySelector(sel) {
      if (sel === ".btn") return byId.actions.querySelector(".btn");
      return null;
    },
    querySelectorAll(sel) {
      if (sel === ".btn") return byId.actions.querySelectorAll(".btn");
      return [];
    },
    createElement(tag) { return makeEl(tag); },
    addEventListener() {}
  };
  global.window = global;
  global.performance = { now: () => Date.now() };
  global.requestAnimationFrame = () => 1;
  global.cancelAnimationFrame = () => {};
  global.AudioContext = undefined;
  global.webkitAudioContext = undefined;

  return byId;
}

function loadApp() {
  const byId = installDom();
  const SetPace = { api: {} };
  for (const m of MODULES) {
    const code = readFileSync(resolve(SRC, m), "utf8");
    const fn = new Function("SetPace", "module", "exports", code + "\n;return SetPace;");
    fn(SetPace, undefined, {});
  }
  const appCode = readFileSync(resolve(SRC, "app.js"), "utf8");
  const appFn = new Function("SetPace", "module", "exports", appCode + "\n;return SetPace;");
  appFn(SetPace, undefined, {});
  return { SetPace, byId };
}

test("api.commit.commit is a function (wiring contract)", () => {
  const { SetPace } = loadApp();
  assert.equal(typeof SetPace.api.commit, "object");
  assert.equal(typeof SetPace.api.commit.commit, "function");
  assert.equal(typeof SetPace.api.render.render, "function");
  assert.equal(typeof SetPace.boot, "function");
});

test("boot paints Home without throwing", () => {
  const { SetPace, byId } = loadApp();
  assert.doesNotThrow(() => SetPace.boot());
    assert.equal(byId.heading.textContent, "Let's train");
  assert.equal(byId.eyebrow.textContent, "SETPACE");
  const buttons = byId.actions.querySelectorAll(".btn");
  assert.ok(buttons.length >= 2, "Home has Train + Exercises");
  assert.equal(buttons[0].dataset.id, "mode_train");
  assert.equal(typeof buttons[0]._spHandler, "object");
  assert.equal(buttons[0]._spHandler.t, "SELECT_HOME");
});

test("commit keeps focused button across rest-frame text updates", () => {
  const { SetPace, byId } = loadApp();
  SetPace.boot();

  const frameA = {
    eyebrow: "Rest",
    heading: "Next",
    hero: "1:00",
    meta: "breathe",
    mood: "rest",
    progress: 0.2,
    demo: null,
    actions: [
      { id: "primary", label: "Skip rest", event: { t: "PRIMARY" } },
      { id: "menu", label: "Menu", event: { t: "OPEN_MENU" } }
    ]
  };
  const ports = {
    dispatch() {},
    getLastFocusId: () => "menu",
    setLastFocusId() {}
  };
  let focusId = "menu";
  ports.getLastFocusId = () => focusId;
  ports.setLastFocusId = (id) => { focusId = id; };

  SetPace.api.commit.commit(frameA, ports);
  assert.equal(document.activeElement && document.activeElement.dataset.id, "menu");

  const frameB = Object.assign({}, frameA, { hero: "0:59" });
  SetPace.api.commit.commit(frameB, ports);
  assert.equal(document.activeElement && document.activeElement.dataset.id, "menu");
  assert.equal(byId.hero.textContent, "0:59");
  assert.equal(byId.actions.children.length, 2);
});
