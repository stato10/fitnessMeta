/* module: taught (localStorage adapter) */
(function () {
  "use strict";

  function loadTaughtEver(TAUGHT_KEY) {
    try {
      var raw = localStorage.getItem(TAUGHT_KEY);
      if (!raw) return [];
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function persistTaught(TAUGHT_KEY, id) {
    try {
      var arr = loadTaughtEver(TAUGHT_KEY);
      if (arr.indexOf(id) === -1) arr.push(id);
      localStorage.setItem(TAUGHT_KEY, JSON.stringify(arr));
    } catch (e) {}
  }

  var api = {
    loadTaughtEver: loadTaughtEver,
    persistTaught: persistTaught
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.taught = api;
})();