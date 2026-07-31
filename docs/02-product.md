# 2. Product Definition

## 2.1 What SetPace is

SetPace picks a beginner workout and runs it on the glasses display. It answers,
without the user touching a phone:

> What should I train today — and what am I doing right now?

The user chooses a plan (Full body / Upper push / Legs), then for each new
exercise gets a short **Teach** flow: a looping stick-figure demo of the
movement pattern plus 3–5 step cues (sit, grip, move). After that, the usual
set → rest → next-set loop takes over.

It is **not** a live form checker and not a rep counter. Teach steps are
instructional cues only — the glasses cannot see the wearer, so they cannot
verify technique. Deeper form learning stays off-device or before the session.

## 2.1a Teach phase (beginners)

Before the first set of each exercise (and again if the user selects **How to**
from Set ready), the app enters `Teach`:

- Canvas demo keyed by movement family: `press`, `pulldown`, `curl`, `raise`,
  `plank` (no network video).
- One short step on screen (≤28 chars) with `Step N/M`.
- Primary: **Next** / **Got it**; secondary: **Skip**.
- Subsequent sets of the same exercise skip Teach automatically.
- When the next exercise differs, Teach runs again for that exercise.

## 2.2 Why rep counting is deliberately out of scope

The obvious feature request for gym glasses is automatic rep counting. It is a
trap, and rejecting it is the most important product decision here.

- The camera faces forward and cannot see the wearer performing the movement.
  It is also unavailable on the Web Apps path entirely.
- The IMU is available, and head-mounted rep detection genuinely works for a few
  movements (squat, overhead press) while failing for most others (bench, rows,
  curls, anything where the head stays still).
- A rep counter that is right 85% of the time is worse than none, because the
  user now has to verify every set instead of trusting the log.
- The value of glasses here is not counting. Users can count. The value is not
  breaking focus to pick up a phone between sets.

So: the user finishes a set and selects once. The app logs the planned reps.
Deviations go through a short adjust flow. This is faster and more trustworthy
than any sensing available on this hardware.

## 2.3 Why the gym fits this device

The constraints that hurt other app ideas mostly do not bite here.

- **No camera needed**, so the Web Apps path is viable and there is no companion
  native app to build.
- **No network in the interaction loop.** The plan is loaded before the first
  set. Nothing is fetched while training.
- **Bursty display use** fits the battery envelope. The display matters for a
  few seconds per set.
- **Hands are genuinely occupied.** The user is holding a barbell. This is a
  real instance of the problem the hardware solves, not a contrived one.

The one place the hardware fights back is display sleep during rest: the
countdown may not stay on screen, so the end-of-rest tone (with a flash as
backup) is load-bearing. Covered in 2.7.

## 2.4 The core loop

```
Pick plan  ->  [ Teach (new exercise)  ->  Set ready  ->  Set active  ->  Rest ] x N  ->  Summary
```

**Plan select.** "What today?" with three curated beginner plans.

**Teach.** Stick-figure demo + step text for machine setup and movement. Default
focus: Next. Skip available for returning users.

**Set ready.** Exercise name, equipment cue, target weight and reps, set index.
Default focus: start the set. Secondary: How to (re-open Teach).

**Set active.** Minimal static frame, exercise and target only. No countdown, no
animation, nothing moving in peripheral vision while the user is under load.
Default focus: set complete.

**Rest.** Large countdown plus the next target, so the user can plan the next
set. Default focus: skip rest. This is the only phase with a recurring update
and the only phase where undo is available.

**Summary.** Sets completed, total time, total volume, written to local storage.

## 2.5 Interaction design

Everything runs on the five events the platform provides: four arrow keys and a
select. Arrow keys move a focus ring, select activates the focused element.

Three rules make this usable without looking.

**Every frame has exactly one primary action, focused by default.** A blind
select always does the most likely thing. In the common case the user never
reads the screen to advance, which is the entire point of the device.

**The primary action never moves.** It sits in the same screen position in every
phase. Muscle memory should carry the user through a whole workout.

**Secondary actions live below the primary, reached with a single arrow.** With
an 88 px minimum element height there is room for at most three actions per
frame, so the budget is spent on: primary, adjust, and (during rest only) undo.

Undo deserves a note. Without a back gesture it has to be an on-screen element
competing for a very small budget, so it only exists during rest. That turns out
to be the only place it is needed: rest is the phase immediately after the
action most likely to be a mistake, and the only phase where the user has idle
time to correct it.

## 2.6 Layout and text budget

Fixed 600x600, no scrolling, bright elements on pure black.

| Slot | Size | Limit |
|---|---|---|
| Heading | 28 px | 18 chars, exercise name |
| Hero | 96-120 px | The one number that matters: `60 kg x 8` or `1:30` |
| Meta | 18 px | 28 chars, `Set 2/4 - next 3:00` |
| Actions | 88 px min height each | 12 chars per label, 2-3 max |

That comes to roughly 440 px of a 600 px viewport, leaving comfortable margins.

Content exceeding these limits is a **build-time validation error on the plan**,
not a runtime truncation. A plan that cannot be displayed should fail in CI, not
on the glasses. Runtime ellipsis truncation exists only as a guard for
user-entered exercise names.

## 2.7 Signalling the end of rest

Rest ends while the user is often not looking, and the display may already be
asleep ([section 1.4a](01-platform.md)). Both are verified on device.

**Primary cue: a short tone.** Audio from a Web App is audible on the glasses
([section 1.4](01-platform.md)). Fire it when rest ends, including when the
deadline passed while the page was hidden — play on the next resume if needed.

**Secondary cue: a full-viewport bright flash.** Noticed in the probe; small
shapes (e.g. expanding circle) were not. Use a solid full-screen pulse only,
about three frames over ~1.2 s, then settle on the next-set frame. Skip the
pulse if more than ~30 s have passed since the deadline (stale wake-up).

Tone + flash together cover a noisy gym and a sleeping display. Motion during
`SetActive` stays banned.

## 2.8 What this app does not do

Recorded so they are not re-litigated later:

- Automatic rep counting (2.2).
- Live form checking or injury warnings. Teach demos and step text are cues only;
  safety-critical claims from a monocular HUD with no view of the user are not
  defensible.
- Camera use of any kind. It rules out the Web Apps path and buys nothing here.
- Live cloud sync during a workout. Nothing that can fail belongs in the
  interaction loop.
- Animation during `SetActive`. Motion in the periphery of someone under a
  loaded barbell is a safety issue, not a polish opportunity.
