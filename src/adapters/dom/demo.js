/* module: demo (canvas + GIF demo adapter) */
(function () {
  "use strict";

  var demoCanvas = null;
  var demoGif = null;
  var demoCredit = null;
  var demoCtx = null;
  var demoRaf = null;
  var demoKind = null;
  var demoStart = 0;
  var demoMode = null; // "gif" | "canvas"

  // Lazy init: module load must not touch the DOM (build.mjs validates content
  // in Node). Elements resolve on first startDemo/stopDemo, in-browser only.
  function init() {
    if (demoCanvas) return;
    demoCanvas = document.getElementById("demo");
    demoGif = document.getElementById("demoGif");
    demoCredit = document.getElementById("demoCredit");
    demoCtx = demoCanvas.getContext("2d");
  }

  function gifForKind(kind) {
    if (!kind) return null;
    var EX = SetPace.api.constants.EX;
    if (EX[kind] && EX[kind].gif) return EX[kind].gif;
    for (var id in EX) {
      if (EX[id].demo === kind && EX[id].gif) return EX[id].gif;
    }
    return null;
  }

  function stopDemo() {
    init();
    if (demoRaf) {
      cancelAnimationFrame(demoRaf);
      demoRaf = null;
    }
    demoKind = null;
    demoMode = null;
    demoCanvas.classList.remove("off");
    demoGif.classList.remove("on");
    demoGif.removeAttribute("src");
    demoCredit.classList.remove("on");
    demoCredit.textContent = "";
  }

  function strokeCyan(ctx, w) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#00e5ff";
    ctx.fillStyle = "#00e5ff";
    ctx.lineWidth = w || 4;
  }

  function strokeMute(ctx, w) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#5f8a92";
    ctx.lineWidth = w || 3;
  }

  function strokeHi(ctx, w) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#e8ffff";
    ctx.lineWidth = w || 3;
  }

  function head(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 0→1→0 smooth loop
  function wave(p) {
    return 0.5 - 0.5 * Math.cos(Math.PI * 2 * p);
  }

  // Arrow showing motion direction
  function arrow(ctx, x1, y1, x2, y2) {
    strokeHi(ctx, 2);
    line(ctx, x1, y1, x2, y2);
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var s = 8;
    line(ctx, x2, y2, x2 - s * Math.cos(ang - 0.4), y2 - s * Math.sin(ang - 0.4));
    line(ctx, x2, y2, x2 - s * Math.cos(ang + 0.4), y2 - s * Math.sin(ang + 0.4));
  }

  // --- Per-exercise drawings ---

  // Seated, sled/platform moves away with feet (horizontal press)
  function drawLegPress(ctx, p) {
    var a = wave(p);
    var sled = 70 + a * 55;
    strokeMute(ctx, 3);
    line(ctx, 20, 40, 20, 200); // back frame
    line(ctx, 20, 130, 250, 190); // rail
    line(ctx, 20, 150, 100, 200);
    strokeCyan(ctx, 4);
    head(ctx, 55, 85, 11);
    line(ctx, 55, 96, 90, 130); // torso on pad
    line(ctx, 90, 130, sled, 155); // thighs to platform
    line(ctx, 90, 130, sled - 8, 168);
    strokeHi(ctx, 4);
    line(ctx, sled, 140, sled, 185); // foot plate
    line(ctx, sled - 14, 162, sled + 6, 162);
    arrow(ctx, sled + 10, 120, sled + 40, 120);
  }

  // Seated upright, handles push FORWARD from chest
  function drawChestPress(ctx, p) {
    var a = wave(p);
    var push = a * 42;
    strokeMute(ctx, 3);
    line(ctx, 40, 50, 40, 200);
    line(ctx, 40, 170, 160, 170); // seat
    line(ctx, 40, 70, 40, 150); // back pad
    strokeCyan(ctx, 4);
    head(ctx, 70, 70, 11);
    line(ctx, 70, 81, 70, 130);
    line(ctx, 70, 130, 55, 170);
    line(ctx, 70, 130, 95, 170);
    line(ctx, 70, 100, 115 + push, 95);
    line(ctx, 70, 105, 115 + push, 110);
    strokeHi(ctx, 4);
    line(ctx, 115 + push, 88, 115 + push, 118);
    arrow(ctx, 130 + push, 100, 165 + push * 0.3, 100);
  }

  // Seated under tower, wide bar pulls DOWN to chest
  function drawLatPulldown(ctx, p) {
    var a = wave(p);
    var barY = 45 + a * 55;
    strokeMute(ctx, 3);
    line(ctx, 140, 15, 140, 45); // cable tower
    line(ctx, 60, 200, 220, 200);
    line(ctx, 90, 175, 190, 175); // seat
    line(ctx, 100, 175, 100, 155); // thigh pad posts
    line(ctx, 180, 175, 180, 155);
    strokeCyan(ctx, 4);
    head(ctx, 140, 110, 11);
    line(ctx, 140, 121, 140, 160);
    line(ctx, 140, 160, 115, 175);
    line(ctx, 140, 160, 165, 175);
    line(ctx, 140, 130, 95, barY);
    line(ctx, 140, 130, 185, barY);
    strokeHi(ctx, 4);
    line(ctx, 85, barY, 195, barY);
    strokeMute(ctx, 2);
    line(ctx, 140, 15, 140, barY);
    arrow(ctx, 210, 50, 210, 95);
  }

  // Seated, handles press UP overhead
  function drawShoulderPress(ctx, p) {
    var a = wave(p);
    var up = a * 48;
    strokeMute(ctx, 3);
    line(ctx, 50, 40, 50, 200);
    line(ctx, 50, 175, 170, 175);
    strokeCyan(ctx, 4);
    head(ctx, 95, 95, 11);
    line(ctx, 95, 106, 95, 145);
    line(ctx, 95, 145, 75, 175);
    line(ctx, 95, 145, 120, 175);
    var handY = 85 - up;
    line(ctx, 95, 115, 70, handY);
    line(ctx, 95, 115, 120, handY);
    strokeHi(ctx, 4);
    line(ctx, 62, handY, 78, handY);
    line(ctx, 112, handY, 128, handY);
    arrow(ctx, 150, 90, 150, 50);
  }

  // Standing at low cable, curl bar up
  function drawCableCurl(ctx, p) {
    var a = wave(p);
    var bend = a * 1.2;
    strokeMute(ctx, 3);
    line(ctx, 40, 20, 40, 200); // stack
    line(ctx, 40, 195, 90, 195); // low pulley
    strokeCyan(ctx, 4);
    head(ctx, 130, 45, 11);
    line(ctx, 130, 56, 130, 120);
    line(ctx, 130, 120, 110, 175);
    line(ctx, 130, 120, 150, 175);
    var ex = 150, ey = 95;
    line(ctx, 130, 75, ex, ey);
    var hx = ex + Math.cos(-0.3 - bend) * 42;
    var hy = ey + Math.sin(-0.3 - bend) * 42;
    line(ctx, ex, ey, hx, hy);
    strokeHi(ctx, 3);
    line(ctx, hx - 10, hy, hx + 10, hy);
    strokeMute(ctx, 2);
    line(ctx, 90, 195, hx, hy);
    arrow(ctx, 185, 130, 185, 85);
  }

  // Forearm plank hold with breath pulse
  function drawPlank(ctx, p) {
    var pulse = 0.8 + 0.2 * Math.sin(p * Math.PI * 2);
    strokeMute(ctx, 3);
    line(ctx, 30, 170, 250, 170);
    strokeCyan(ctx, 4);
    ctx.globalAlpha = pulse;
    head(ctx, 55, 105, 10);
    line(ctx, 65, 112, 190, 112);
    line(ctx, 75, 112, 70, 155);
    line(ctx, 85, 112, 90, 155);
    line(ctx, 190, 112, 215, 155);
    line(ctx, 190, 112, 200, 155);
    ctx.globalAlpha = 1;
    strokeHi(ctx, 2);
    line(ctx, 120, 90, 120, 100);
    line(ctx, 140, 88, 140, 100);
    line(ctx, 160, 90, 160, 100);
  }

  // Incline: back pad angled, press up-and-out
  function drawIncline(ctx, p) {
    var a = wave(p);
    var push = a * 38;
    strokeMute(ctx, 3);
    line(ctx, 35, 60, 80, 170); // incline pad
    line(ctx, 80, 170, 180, 170);
    strokeCyan(ctx, 4);
    head(ctx, 70, 75, 11);
    line(ctx, 75, 88, 95, 135); // angled torso
    line(ctx, 95, 135, 80, 170);
    line(ctx, 95, 135, 120, 170);
    var hx = 130 + push * 0.7;
    var hy = 100 - push * 0.55;
    line(ctx, 95, 110, hx, hy);
    line(ctx, 100, 115, hx + 8, hy + 12);
    strokeHi(ctx, 4);
    line(ctx, hx - 4, hy - 6, hx + 12, hy + 16);
    arrow(ctx, 165, 95, 200, 70);
  }

  // Standing, elbows pinned, push cable DOWN to hips
  function drawTriPush(ctx, p) {
    var a = wave(p);
    var down = a * 50;
    strokeMute(ctx, 3);
    line(ctx, 50, 15, 50, 200);
    line(ctx, 50, 30, 140, 30); // high pulley arm
    strokeCyan(ctx, 4);
    head(ctx, 140, 55, 11);
    line(ctx, 140, 66, 140, 130);
    line(ctx, 140, 130, 120, 180);
    line(ctx, 140, 130, 160, 180);
    var handY = 95 + down;
    line(ctx, 140, 85, 125, 100);
    line(ctx, 140, 85, 155, 100);
    line(ctx, 125, 100, 125, handY);
    line(ctx, 155, 100, 155, handY);
    strokeHi(ctx, 4);
    line(ctx, 115, handY, 165, handY);
    strokeMute(ctx, 2);
    line(ctx, 140, 30, 140, handY);
    arrow(ctx, 185, 110, 185, 155);
  }

  // Lying face-down: heels curl toward glutes
  function drawLegCurl(ctx, p) {
    var a = wave(p);
    var curl = a * 1.1;
    strokeMute(ctx, 3);
    line(ctx, 40, 100, 220, 100); // bench
    line(ctx, 50, 100, 50, 180);
    line(ctx, 210, 100, 210, 180);
    strokeCyan(ctx, 4);
    head(ctx, 55, 85, 10);
    line(ctx, 65, 90, 140, 90);
    var kneeX = 155, kneeY = 100;
    line(ctx, 140, 90, kneeX, kneeY);
    var fx = kneeX + Math.cos(0.15 + curl) * 55;
    var fy = kneeY - Math.sin(0.15 + curl) * 55;
    line(ctx, kneeX, kneeY, fx, fy);
    strokeHi(ctx, 4);
    line(ctx, fx - 8, fy - 6, fx + 8, fy + 6);
    arrow(ctx, 210, 140, 195, 100);
  }

  // Seated, shin pad extends forward/up as knees straighten
  function drawLegExt(ctx, p) {
    var a = wave(p);
    var ext = a * 1.15;
    strokeMute(ctx, 3);
    line(ctx, 50, 50, 50, 195);
    line(ctx, 50, 160, 140, 160); // seat
    strokeCyan(ctx, 4);
    head(ctx, 85, 70, 11);
    line(ctx, 85, 81, 85, 130);
    line(ctx, 85, 130, 70, 160);
    var kneeX = 130, kneeY = 155;
    line(ctx, 85, 130, kneeX, kneeY);
    var sx = kneeX + Math.cos(-0.2 + ext * 1.3) * 55;
    var sy = kneeY + Math.sin(-0.2 + ext * 1.3) * 55;
    line(ctx, kneeX, kneeY, sx, sy);
    strokeHi(ctx, 4);
    line(ctx, sx - 10, sy - 4, sx + 10, sy + 4); // shin pad
    arrow(ctx, 200, 170, 220, 130);
  }

  // Standing on edge, heels rise (calf)
  function drawCalfRaise(ctx, p) {
    var a = wave(p);
    var lift = a * 28;
    strokeMute(ctx, 3);
    line(ctx, 60, 175, 220, 175); // platform edge
    line(ctx, 60, 175, 60, 200);
    strokeCyan(ctx, 4);
    head(ctx, 140, 40, 11);
    line(ctx, 140, 51, 140, 110);
    line(ctx, 140, 110, 115, 160 - lift);
    line(ctx, 140, 110, 165, 160 - lift);
    strokeHi(ctx, 4);
    line(ctx, 108, 165 - lift, 122, 165 - lift);
    line(ctx, 158, 165 - lift, 172, 165 - lift);
    line(ctx, 115, 165 - lift, 115, 175 - lift * 0.2);
    line(ctx, 165, 165 - lift, 165, 175 - lift * 0.2);
    arrow(ctx, 200, 150, 200, 115);
  }

  // Bodyweight squat: hips sit back, then stand
  function drawBwSquat(ctx, p) {
    var a = wave(p);
    var hipY = 100 + a * 35;
    strokeMute(ctx, 2);
    line(ctx, 50, 200, 230, 200);
    strokeCyan(ctx, 4);
    var headY = 45 + a * 25;
    head(ctx, 140, headY, 11);
    line(ctx, 140, headY + 11, 140 - a * 12, hipY);
    var ky = hipY + 20 + a * 10;
    line(ctx, 140 - a * 12, hipY, 110, ky);
    line(ctx, 140 - a * 12, hipY, 170, ky);
    line(ctx, 110, ky, 105, 195);
    line(ctx, 170, ky, 175, 195);
    arrow(ctx, 210, 80 + a * 40, 210, 130);
  }

  function drawGobletSquat(ctx, p) {
    drawBwSquat(ctx, p);
    var a = wave(p);
    var hipY = 100 + a * 35;
    var headY = 45 + a * 25;
    strokeHi(ctx, 4);
    line(ctx, 128, headY + 28, 152, headY + 28);
    line(ctx, 140, headY + 22, 140, headY + 34);
  }

  function drawBbBench(ctx, p) {
    var a = wave(p);
    var barY = 95 + a * 28;
    strokeMute(ctx, 3);
    line(ctx, 40, 150, 240, 150); // bench
    line(ctx, 70, 150, 70, 195);
    line(ctx, 210, 150, 210, 195);
    strokeCyan(ctx, 4);
    head(ctx, 100, 125, 10);
    line(ctx, 110, 130, 180, 130); // torso on bench
    line(ctx, 150, 130, 140, 150);
    line(ctx, 170, 130, 185, 150);
    line(ctx, 130, 130, 115, barY);
    line(ctx, 170, 130, 185, barY);
    strokeHi(ctx, 4);
    line(ctx, 90, barY, 210, barY);
    arrow(ctx, 230, 130, 230, 100);
  }

  function drawBentRow(ctx, p) {
    var a = wave(p);
    var pull = a * 36;
    strokeMute(ctx, 2);
    line(ctx, 40, 200, 240, 200);
    strokeCyan(ctx, 4);
    head(ctx, 90, 70, 11);
    line(ctx, 95, 82, 150, 120); // hinged torso
    line(ctx, 150, 120, 130, 185);
    line(ctx, 150, 120, 175, 185);
    var barY = 155 - pull;
    line(ctx, 150, 110, 150, barY);
    strokeHi(ctx, 4);
    line(ctx, 110, barY, 190, barY);
    arrow(ctx, 210, 150, 210, 115);
  }

  function drawDbOhp(ctx, p) {
    var a = wave(p);
    var up = a * 45;
    strokeMute(ctx, 3);
    line(ctx, 70, 175, 190, 175);
    strokeCyan(ctx, 4);
    head(ctx, 130, 70, 11);
    line(ctx, 130, 81, 130, 130);
    line(ctx, 130, 130, 110, 175);
    line(ctx, 130, 130, 150, 175);
    var hy = 85 - up;
    line(ctx, 130, 100, 105, hy);
    line(ctx, 130, 100, 155, hy);
    strokeHi(ctx, 4);
    line(ctx, 98, hy, 112, hy);
    line(ctx, 148, hy, 162, hy);
    arrow(ctx, 185, 90, 185, 50);
  }

  function drawDbCurl(ctx, p) {
    drawCableCurl(ctx, p);
  }

  function drawRdl(ctx, p) {
    var a = wave(p);
    var hipY = 110 + a * 15;
    var headY = 45 + a * 35;
    var barY = 160 + a * 25;
    strokeMute(ctx, 2);
    line(ctx, 50, 200, 230, 200);
    strokeCyan(ctx, 4);
    head(ctx, 140 - a * 20, headY, 11);
    line(ctx, 140 - a * 18, headY + 12, 150, hipY);
    line(ctx, 150, hipY, 125, 190);
    line(ctx, 150, hipY, 170, 190);
    line(ctx, 150, hipY, 150, barY);
    strokeHi(ctx, 4);
    line(ctx, 115, barY, 185, barY);
    arrow(ctx, 210, 100, 210, 145);
  }

  function drawDbLunge(ctx, p) {
    var a = wave(p);
    var drop = a * 25;
    strokeMute(ctx, 2);
    line(ctx, 40, 200, 240, 200);
    strokeCyan(ctx, 4);
    head(ctx, 130, 50 + drop * 0.4, 11);
    line(ctx, 130, 62 + drop * 0.4, 130, 110 + drop * 0.3);
    line(ctx, 130, 110 + drop * 0.3, 95, 155 + drop * 0.2);
    line(ctx, 95, 155 + drop * 0.2, 85, 195);
    line(ctx, 130, 110 + drop * 0.3, 170, 160 + drop);
    line(ctx, 170, 160 + drop, 185, 195);
    strokeHi(ctx, 3);
    line(ctx, 118, 115, 118, 135); // DB
    line(ctx, 142, 115, 142, 135);
    arrow(ctx, 210, 100, 210, 140);
  }

  function drawDbIncPress(ctx, p) {
    drawIncline(ctx, p);
    var a = wave(p);
    var push = a * 38;
    var hx = 130 + push * 0.7;
    var hy = 100 - push * 0.55;
    strokeHi(ctx, 3);
    line(ctx, hx - 6, hy, hx + 6, hy); // DB heads
  }

  function drawKickback(ctx, p) {
    var a = wave(p);
    var ext = a * 1.1;
    strokeMute(ctx, 2);
    line(ctx, 40, 200, 240, 200);
    strokeCyan(ctx, 4);
    head(ctx, 90, 75, 11);
    line(ctx, 95, 86, 145, 120); // hinge
    line(ctx, 145, 120, 125, 185);
    line(ctx, 145, 120, 170, 185);
    var elbowX = 155, elbowY = 105;
    line(ctx, 145, 100, elbowX, elbowY);
    var hx = elbowX + Math.cos(-0.2 + ext) * 40;
    var hy = elbowY + Math.sin(-0.2 + ext) * 40;
    line(ctx, elbowX, elbowY, hx, hy);
    strokeHi(ctx, 3);
    line(ctx, hx - 6, hy, hx + 6, hy);
    arrow(ctx, 200, 130, 210, 100);
  }

  function drawDbCalf(ctx, p) {
    drawCalfRaise(ctx, p);
    strokeHi(ctx, 3);
    var a = wave(p);
    var lift = a * 28;
    line(ctx, 125, 90 - lift * 0.2, 125, 115 - lift * 0.2);
    line(ctx, 155, 90 - lift * 0.2, 155, 115 - lift * 0.2);
  }

  var DEMO_DRAW = {
    legpress: drawLegPress,
    chestpress: drawChestPress,
    latpulldown: drawLatPulldown,
    shpress: drawShoulderPress,
    cablecurl: drawCableCurl,
    plank: drawPlank,
    incline: drawIncline,
    tripush: drawTriPush,
    legcurl: drawLegCurl,
    legext: drawLegExt,
    calfraise: drawCalfRaise,
    bwsquat: drawBwSquat,
    gobletsquat: drawGobletSquat,
    bbbench: drawBbBench,
    bentrow: drawBentRow,
    dbohp: drawDbOhp,
    dbcurl: drawDbCurl,
    rdl: drawRdl,
    dblunge: drawDbLunge,
    dbincpress: drawDbIncPress,
    kickback: drawKickback,
    dbcalf: drawDbCalf
  };

  function drawDemoFrame(kind, t0) {
    var ctx = demoCtx;
    var w = demoCanvas.width;
    var h = demoCanvas.height;
    ctx.clearRect(0, 0, w, h);
    var elapsed = (t0 - demoStart) / 1000;
    var period = kind === "plank" ? 1.8 : 1.6;
    var p = (elapsed % period) / period;
    var fn = DEMO_DRAW[kind] || drawChestPress;
    fn(ctx, p);
  }

  function startDemo(kind, gifOverride) {
    init();
    if (!kind) {
      stopDemo();
      return;
    }
    var gif = gifOverride || gifForKind(kind);
    if (gif) {
      if (demoKind === kind && demoMode === "gif" && demoGif.getAttribute("src") === gif) return;
      stopDemo();
      demoKind = kind;
      demoMode = "gif";
      demoCanvas.classList.add("off");
      demoGif.src = gif;
      demoGif.classList.add("on");
      demoCredit.textContent = "Demo © Gym visual";
      demoCredit.classList.add("on");
      return;
    }
    if (demoKind === kind && demoMode === "canvas" && demoRaf) return;
    stopDemo();
    demoKind = kind;
    demoMode = "canvas";
    demoStart = performance.now();
    function loop(ts) {
      drawDemoFrame(kind, ts);
      demoRaf = requestAnimationFrame(loop);
    }
    demoRaf = requestAnimationFrame(loop);
  }

  var api = { startDemo: startDemo, stopDemo: stopDemo };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else SetPace.api.demo = api;
})();