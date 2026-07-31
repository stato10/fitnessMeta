# 0. Hardware Probe

`index.html` at the repo root is a throwaway diagnostic page. It is not SetPace
and shares no code with it. Its only job is to answer the questions in
[section 4.5](04-edge-cases.md) that cannot be answered from documentation, and
it exists because [Phase 0](05-roadmap.md) gates everything else.

Two of its answers can change the product. If audio works, the rest cue is a
tone and the whole visual-pulse design becomes a secondary cue. If the display
sleeps during a three-minute rest and nothing can prevent it, the rest timer as
specified does not work at all.

Run it before writing any product code.

## 0.1 What it tests

| # | Test | Question | What it changes |
|---|---|---|---|
| 1 | Audio | Can the page make a sound the wearer hears? | The rest-over cue, and possibly the build path |
| 2 | Flash | Does a bright frame catch attention when you are not looking? | Whether a visual cue is viable at all |
| 3 | Display sleep | Does the screen survive three minutes of idle? | Whether a rest timer is possible on this path |
| 4 | Focus targets | Is 88 px selectable while out of breath? | Actions per frame |
| 5 | Text sizes | What is actually readable in a gym? | The type scale in [2.6](02-product.md) |
| 6 | Re-render focus | Does a 1 Hz countdown destroy the focus ring? | Confirms the keyed diff in [3.8](03-architecture.md) |
| 7 | Contrast | Is black really transparent, and what is readable over a busy room? | Background treatment |

Test 1 did not exist in the original plan. The specification says Web Apps
cannot play audio, and that claim is the reason the rest cue is a visual pulse
at all. A shipping fitness Web App on this device appears to use WebAudio,
pre-decoded audio and `speechSynthesis`, and audio is not in Meta's
unsupported-capabilities table. So the claim is now in doubt and this test
resolves it. **Run test 1 first.** A working beep makes test 2 far less
load-bearing, though test 2 is still worth running because the flash remains the
secondary cue.

## 0.2 Getting it onto the glasses

Follow [section 6](06-setup.md). Nothing extra is needed: `index.html` is a
single self-contained file with no build step, no dependencies and no network
requests, and it already carries the `mrbd-web-app-capable` meta tag.

One hosting note. GitHub Pages serves HTML with a ten-minute cache
([6.6](06-setup.md)), which you will feel on every edit. For a page you expect
to iterate on during a gym session, **Vercel or Cloudflare Pages is the better
host** because you can set `Cache-Control: no-store` and deploy from the CLI in
seconds. Either way the reload loop on the glasses is the same: middle pinch,
then **Restart**.

## 0.3 Before you leave the house

- [ ] Page loads in desktop Chrome at 600x600 and you can drive all of it with
      arrow keys and Enter, never touching the mouse.
- [ ] Page loads on the glasses and the menu is readable.
- [ ] Glasses and Neural Band charged. The probe takes 25 to 40 minutes.
- [ ] Phone handy for photographing the results screen.
- [ ] Optional but recommended: start **Display Recording** from the Meta AI app
      for tests 2 and 3. It is the only way to review the flash frame by frame,
      and it is the only record you get of what the lens actually showed.

Navigation, everywhere in the probe: swipe or arrow to move the cyan focus ring,
pinch or Enter to select. Menus **page** rather than scroll, so a test you cannot
see is behind **More tests**. There is no back gesture, so every screen has its
own way out. Do not use the middle pinch except deliberately to Restart: it is
reserved by the OS and opens the Restart / Resume / Permissions menu.

If the lens ever goes blank and stays blank, that is a crash. The probe catches
its own errors and prints them in red, so a genuinely blank display means
something failed before the page was running.

## 0.4 Running it, in order

### Test 1 — Audio (5 min, quiet room, before the gym)

Run all four paths. For each one the probe plays or fires something, waits about
two seconds, then asks what you experienced.

1. **WebAudio oscillator** — three short beeps.
2. **Audio() element** — a tone built as a data URI, no network.
3. **speechSynthesis** — the words "rest complete, next set".
4. **navigator.vibrate** — a haptic pattern, not a sound. Included because if it
   works it is a better rest cue than either audio or flash.

Answer honestly. "Unsure" is a real answer and is more useful than a guess.

> **Good result:** any of the first three is heard clearly. That is the single
> most valuable finding the probe can produce, and it means the rest cue should
> be sound with the flash demoted to a backup.
> **Bad result:** all four silent. The visual pulse is the only channel, and
> test 2 becomes decisive.

Note the difference between silent and broken. The probe records diagnostics
either way: whether the AudioContext reached `running`, whether the element's
`currentTime` advanced, whether `speechSynthesis` fired `start`. If the clock
advanced but you heard nothing, audio is being generated and not routed to the
speakers, which is a different problem from audio being blocked.

### Test 2 — Flash (10 min, in the gym, glasses on)

Six trials in random order: solid white, three slow pulses, a fast strobe, a
circle expanding from the centre, an edge-only frame, and a **control that
flashes nothing**. The control is there to measure your own false-positive rate,
so answer it the same way you answer the others.

For each trial: select **Start trial**, then genuinely look away — at the rack,
at the mirror, at your phone. Do not watch the lens. The screen goes black
(transparent) and fires after a random 6 to 14 second delay.

The probe times how long after the flash you press anything, so **press
something as soon as you notice it** rather than waiting to compose an answer.

Run all six at least twice. Once between sets while breathing hard is worth more
than three times sitting on a bench.

> **Good result:** at least one variant is noticed immediately, consistently,
> while you are not looking, and the control is correctly reported as missed.
> **Bad result:** everything is "only because I was expecting it", or the control
> is reported as noticed. Both mean the flash is not a real attention cue and,
> absent working audio, the rest timer needs the native path.

### Test 3 — Display sleep (15 min, four runs, mostly waiting)

Four runs, each ending in a beep and a flash:

- **A. 3 min, fully static page.** Nothing is written to the DOM after it starts.
- **B. 3 min, 1 Hz countdown.** A number updates every second.
- **C. 3 min, 1 Hz + wakeLock.** Same, plus a screen wake lock request.
- **D. 5 min, 1 Hz + wakeLock.** The longest realistic rest.

Start a run, then leave the glasses alone. **Do not gesture, do not tap the
temple.** Any input resets the idle timer and destroys the measurement. Glance at
the lens occasionally without touching anything.

A versus B is the interesting comparison: it tells you whether periodic DOM
writes keep the display awake, which is the cheapest possible mitigation.

At the end the probe shows you the wake-lock outcome, the worst gap between
ticks and the timer drift, then asks what you saw. If the display slept and the
app restarted, the run is not lost: it was written to storage before it began,
and the probe offers to finish reporting it when it next loads.

> **Good result:** the display stays lit or dims but stays readable for three
> minutes, and the end signal reaches you. Or, less good but workable: it sleeps,
> but the wake lock was granted and prevented it, or B stayed awake while A slept.
> **Bad result:** it goes black after 30 seconds in every run, the wake lock is
> missing or rejected, and the end signal never arrives. That means a background
> rest timer is impossible on the Web Apps path and the timer has to be
> re-conceived, for example as something the user checks rather than something
> that notifies them.

Also worth noting from this test: the worst tick gap. A large gap means the
runtime was throttled or suspended, which is fine for the countdown itself
because time is read from the wall clock, but not fine for a cue that has to
fire at a specific moment.

### Test 4 — Focus targets (5 min, between sets, out of breath)

Four rounds, with 1, 2, 3 and 4 targets. Each round names a letter. Get to it
and select it. The probe counts your presses against the theoretical minimum.

Do this immediately after a hard set, not while resting. That is the condition
that matters.

> **Good result:** presses equal the minimum on almost every round, and every
> round is a hit. Four targets is fine.
> **Bad result:** overshoots and misses at three or four targets. The action
> budget in [2.5](02-product.md) needs to shrink, and 88 px is a floor rather
> than a comfortable size.

The number to take away is extra presses per round, not the feeling. One extra
press on a four-target round is noise; three is a design problem.

### Test 5 — Text sizes (5 min, run twice)

Four ladders, one per content slot: exercise name, the weight-and-reps hero
line, the countdown, and the meta line. Each row is rendered at a real size and
is itself the answer: **select the smallest row you can read comfortably.**

Tag the lighting when it asks. Run the whole test twice, once in gym lighting
and once outdoors in daylight, so the two answers are recorded separately.
Daylight is the harder case and the one that decides the type scale.

> **Good result:** the smallest comfortable sizes are at or below the spec in
> [2.6](02-product.md) — 28 px heading, 96 px hero, 18 px meta.
> **Bad result:** you need the top row of every ladder. The layout budget in 2.6
> is wrong and less fits on a frame than the spec assumes.

### Test 6 — Re-render focus (3 min, anywhere, can be done at a desk)

Two runs of the same 15-second countdown next to a Skip button, implemented two
ways. Leave focus on **Skip rest** and watch. The probe counts, tick by tick,
whether focus survived.

- **Naive full re-render** should fail. Expect the cyan ring to vanish every
  second. Press an arrow to get it back and keep going.
- **Targeted text update** should keep focus on every tick.

> **Good result:** targeted reports 14 or 15 of 15 ticks kept, naive reports
> close to zero. That confirms the keyed diff in
> [3.8](03-architecture.md) is both necessary and sufficient, and it is the
> cheapest finding in the probe.
> **Bad result:** targeted also loses focus. Something in the runtime moves focus
> on its own, and the DOM adapter needs an explicit focus restore after every
> commit rather than relying on leaving elements alone.

This one is honest on a desktop browser too, so run it there first.

### Test 7 — Contrast (5 min, standing somewhere visually busy)

Stand where the lens sits over something cluttered: a rack of plates, a window,
a mirrored wall. Then step through pure black, dark grey, and a grey panel
behind the text, and rank them. The last screen is nearly empty and asks whether
the lens is genuinely clear.

> **Good result:** pure black wins, and the lens reads as clear. That confirms
> the additive-display assumption the whole visual design rests on.
> **Bad result:** text is unreadable over the busy background without the grey
> panel. Every frame needs a lit backing panel, which costs contrast against the
> room and partly defeats the transparency.

## 0.5 Getting the results out

**Results > Read results** shows everything collected as large text, a page at a
time. Photograph each page. That is the primary export and it needs nothing but
the phone.

Three other screens are worth a photo:

- **Key log** — the last few presses with the gap between them and how long each
  was held. It also lists any key the platform sent that is not an arrow or
  Enter, which would be an undocumented gesture and worth knowing about.
- **Device and self-check** — feature detection for AudioContext, speech,
  wakeLock and vibrate, the smallest focusable element the probe actually
  measured on the device, how many selects were dropped as double-fires, and how
  many selects landed with nothing focused.
- **Results > JSON dump** — the full record including every keystroke with
  timestamps. Unreadable on the glasses. Open the same URL in a desktop browser
  and select it there, or read `localStorage.setpace_probe_v1`.

Everything is written to `localStorage` as it happens, so a Restart, a reload or
a flat battery loses nothing. The JSON dump is only readable off-device if you
open the probe on the same origin, so keep the URL stable.

## 0.6 Reporting back

Update [4.5](04-edge-cases.md) with the answers and delete this file's
open questions as they close. The three findings that change the plan, in order:

1. **Audio works.** Rewrite [1.4](01-platform.md) and [2.7](02-product.md), make
   the rest cue a tone, keep the flash as a secondary cue, and delete Phase 5
   from the [roadmap](05-roadmap.md).
2. **Audio does not work and the flash is not noticed.** The Web Apps path
   cannot deliver the core promise. Phase 5 becomes Phase 1 and the project
   grows a companion mobile app.
3. **The display sleeps and cannot be prevented.** The rest timer is not a
   background notifier on this path. Either the product becomes something the
   user glances at deliberately, or it moves to the native path for the same
   reason as case 2.

Anything else is a tuning input rather than a decision, and belongs in
[2.6](02-product.md) or [3.8](03-architecture.md).

## 0.7 What the probe cannot tell you

Stated so the results are not over-read.

- **Battery cost over a full workout.** Open question 4 in
  [4.5](04-edge-cases.md) is not covered. It needs a real session, not a probe.
- **Whether the Neural Band behaves differently from temple captouch.** The probe
  logs keys, not their source, because the platform does not say which gesture
  produced an event.
- **Long-term legibility.** Twenty minutes says nothing about eye strain over an
  hour.
- **Whether a silent audio path is blocked or merely unrouted.** The diagnostics
  narrow it down but cannot see the speaker.
- **Anything about a second wearer.** All of this is one person's eyes, ears and
  gestures. Treat the numbers as a go/no-go signal, not as a measurement.
