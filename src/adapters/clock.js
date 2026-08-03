/* module: clock */
(function () {
  "use strict";

  function now() {
    return Date.now();
  }

  function scheduleTick(dispatch, t) {
    var delay = Math.max(50, 1000 - (t % 1000));
    return setTimeout(function () {
      dispatch({ t: "TICK" });
    }, delay);
  }

  var api = { now: now, scheduleTick: scheduleTick };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.clock = api;
})();