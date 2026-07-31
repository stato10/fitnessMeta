# 4. Edge Cases and Failure Modes

This is the file that decides whether the app feels solid or janky. Each case
has a defined behaviour and a corresponding test.

## 4.1 Input and focus

**Accidental double select.** Two `PRIMARY` events arrive 120 ms apart because
the EMG classifier double-fired or the user twitched. Unhandled, the user
completes a set and instantly skips their own rest.

Handling: a 250 ms idempotency window keyed on `phaseEnteredAt`. A `PRIMARY`
arriving within 250 ms of a phase transition is dropped. This does not delay the
first select, it only suppresses the echo. The threshold sits below deliberate
human re-select speed and above classifier double-fire.

Note this is why undo exists as an explicit action rather than a double-select
gesture. Disambiguating a double select would mean waiting ~450 ms on *every*
select to see whether a second one arrives, paying constant latency on the most
frequent action to support a rare one.

**Focus destroyed by the countdown re-render.** The single most likely
implementation bug on this platform. Covered in
[section 3.8](03-architecture.md); the test is that focus on the undo button
survives ten consecutive ticks.

**Focus lands on an element that disappears.** Rest ends while the user is
focused on undo, and the frame changes to `SetReady`, which has no undo action.
Handling: `commit()` restores focus to `actions[0]`. Focus is never left on
`document.body`, which would make the next select do nothing at all.

**Arrow-key spam.** Handling: arrows only move DOM focus and never reach the
reducer, so this is inert by construction.

**Select while the app is not visible.** Handling: while `paused` is set, all
user events are discarded. Only `TICK` and `VISIBILITY` are processed.

**Undo at the first set.** Handling: undo only exists during `Resting`, which is
only reachable after a set has been logged, so there is always something to
undo. Undo pops the last `LoggedSet`, restores `cursor`, clears `restEndsAt`,
and returns to `SetActive`. It is one level deep and there is no redo.

## 4.2 Time

**Rest expires while the app is backgrounded or the glasses are off.** The user
took them off for four minutes. Handling: nothing special, because `restEndsAt`
is absolute. On resume the reducer sees the deadline has passed and renders
`SetReady`. The rest-over pulse is suppressed if more than 30 s have elapsed
past the deadline, since an attention cue for a four-minute-old event is noise.

**The user rests far longer than planned.** Handling: after the deadline the app
sits in `SetReady` and the meta line shows overtime (`+2:14`). It never blocks,
nags, or auto-advances. Overtime is recorded in the log.

**Device clock jumps.** A backwards jump makes `restEndsAt - now()` exceed the
original duration. Handling: clamp `remainingMs` to `restSec * 1000`. A forward
jump simply ends rest, which is the safe direction.

**Tick fires late.** The runtime was throttled and the scheduler wakes 3 s after
the deadline. Handling: irrelevant by construction, since remaining time is read
from the clock rather than accumulated. The frame is correct whenever drawn.

**Tick fires early or twice in one second.** Handling: the rendered string is a
pure function of the clock, so a duplicate tick produces an identical frame and
the keyed diff makes it a no-op.

## 4.3 Runtime and connectivity

**Page reload mid-workout.** Handling: `SessionState` is already persisted per
transition. On boot, load it, check `schemaVersion`, and resume. If `startedAt`
is more than 6 hours old, offer to discard rather than silently resuming a stale
workout.

**Network drops mid-workout.** The app is already loaded and fetches nothing
during a workout, so it keeps running. The real exposure is that Web Apps have
no offline support, so a *reload* while offline fails and the app cannot come
back. Handling: never trigger a reload, never fetch during a session, and keep
state in `localStorage` so recovery is possible the moment the app loads again.

**`localStorage` write fails** (quota, private mode). Handling: catch, continue
in memory, and surface a persistent warning on the summary frame. Losing a log
is acceptable; crashing mid-workout is not.

**Glasses battery dies.** Handling: same as a reload. State survives.

## 4.4 Content and data

**Exercise name too long.** Handling: `validatePlan` rejects it at authoring
time, naming the field and the limit. Runtime ellipsis truncation exists only
for user-typed names that bypass validation.

**Unit mismatch.** Weights are stored canonically in kg and converted only at
render. Plans authored in pounds convert on import. No display path reads a
non-canonical stored value.

**Bodyweight and timed exercises.** `targetWeightKg` is `null`, and the hero
line renders `x 12` or `0:45` instead of a weight. The reducer path is
identical; only the renderer branches.

**Single-set plan.** The move to `Summary` must be evaluated *after* the cursor
increment, not before, or a one-set plan skips its summary entirely. Explicit
test case.

**Empty plan.** Rejected by `validatePlan`.

**Zero-second rest** (supersets with no pause). Handling: the reducer skips
`Resting` entirely and goes straight to the next `SetReady`. The 250 ms
idempotency window still applies, so a double select cannot blow through two
sets.

**Adding a set from the summary.** Appends a copy of the last `PlannedSet` to a
session-local overlay, never to the stored plan.

## 4.5 Hardware validation results (on-device, 2026-07-31)

1. **Audio from a Web App** — **heard.** Primary rest cue is a tone.
2. **Full-viewport flash** — **noticed.** Expanding circle / small shape —
   **not noticed.** Secondary cue = full-screen flash only.
3. **Display sleep** — **screen turned off** during idle. Design for sleep;
   wall-clock timers + tone on resume if rest already ended.
4. **Battery over a full workout** — still open (needs a real session).
5. **88 px targets while breathing hard** — not separately logged; treat as OK
   for v1 unless gym use shows misses.
6. **Text sizes in gym / daylight** — user reported the UI was generally
   visible ("saw everything"); keep the [2.6](02-product.md) budget.
7. **1 Hz re-render vs focus** — still worth confirming in the first workout
   build; keep keyed DOM updates as specified.
