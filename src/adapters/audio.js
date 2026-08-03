/* module: audio */
(function () {
  "use strict";

  var ctx = null;

  function ensureAudio() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function playTone() {
    try {
      var c = ensureAudio();
      if (!c) return;
      var t0 = c.currentTime;
      function chime(freq, at, dur, vol) {
        var o = c.createOscillator();
        var g = c.createGain();
        o.type = "sine";
        o.frequency.value = freq;
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(c.destination);
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(vol, at + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.start(at);
        o.stop(at + dur + 0.02);
      }
      chime(523.25, t0, 0.28, 0.16);
      chime(659.25, t0 + 0.14, 0.32, 0.14);
      chime(783.99, t0 + 0.28, 0.45, 0.12);
    } catch (e) {}
  }

  function flashPulse() {
    try {
      var el = document.getElementById("flash");
      if (!el) return;
      var n = 0;
      function beat() {
        el.classList.add("on");
        setTimeout(function () {
          el.classList.remove("on");
          n++;
          if (n < 2) setTimeout(beat, 160);
        }, 220);
      }
      beat();
    } catch (e) {}
  }

  function fireCue() {
    playTone();
    flashPulse();
  }

  var api = { ensureAudio: ensureAudio, playTone: playTone, flashPulse: flashPulse, fireCue: fireCue };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.audio = api;
})();