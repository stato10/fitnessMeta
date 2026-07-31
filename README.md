# SetPace

A strength-workout runner for Meta Ray-Ban Display glasses. It shows the current
set and the rest countdown in the lens, so the user never picks up a phone
between sets.

Status: Playable v1 — plan picker + Teach demos + workout loop —
https://stato10.github.io/fitnessMeta/

## The idea in one paragraph

The user picks what to train (Full body / Upper / Legs). Before each new
exercise, SetPace shows a short looping stick-figure demo and step-by-step setup
cues on the lens, then runs the set and rest countdown so they never pick up a
phone between sets. Everything loads up front (no network video). There is no
camera, no live form checking, and no automatic rep counting.

Built as a Meta **Web App**: standard HTML, CSS and JavaScript running
standalone on the glasses, with no companion mobile app.

## Run it

- **Workout (product):** https://stato10.github.io/fitnessMeta/
- **Hardware probe:** https://stato10.github.io/fitnessMeta/probe.html

On glasses: What today? → Teach (demo + Next steps) → Start set → Done → rest
→ tone + flash → next set (Teach again when the exercise changes). Arrows move
focus; Enter selects. Probe findings (audio works, display sleeps, full-screen
flash works) are in [docs/04-edge-cases.md](docs/04-edge-cases.md) §4.5.

## Spec

Read in order:

0. [Hardware probe](docs/00-probe.md) — what to run on the glasses first, and
   how to read the results
1. [Platform constraints](docs/01-platform.md) — verified hardware and SDK
   limits, and what follows from them
2. [Product definition](docs/02-product.md) — what the app does, what it
   deliberately does not, and the interaction model
3. [Architecture](docs/03-architecture.md) — data model, state machine, timer
   strategy, adapter port
4. [Edge cases](docs/04-edge-cases.md) — defined behaviour for every way this
   can go wrong, including verified probe results
5. [Build plan](docs/05-roadmap.md) — phased, with the risky part first
6. [Setup and iteration](docs/06-setup.md) — getting a page onto real glasses
   and changing it afterwards

## The decisions that shape everything

**The input model is a D-pad, and focus is the whole interface.** Neural Band
and captouch gestures arrive as nothing but arrow keys and Enter. So every frame
has exactly one primary action, focused by default and always in the same
position, and a blind select does the right thing. Elements have an 88 px
minimum height, which caps a frame at two or three actions.

**Timers are absolute deadlines, never accumulated ticks.** Glasses come off and
apps get backgrounded constantly in a gym. Computing remaining time from the
wall clock makes pause, resume, throttling and reload all correct without a
single special case.

**Re-rendering must not destroy focus.** The countdown updates every second, and
a naive re-render would reset the focus ring once per second while the user is
reaching for undo. The adapter commits frames through a keyed diff instead.

**No rep counting.** The camera faces away from the user and is unavailable to
Web Apps anyway, IMU detection fails on most lifts, and a counter that is right
85% of the time forces the user to check every set. One select per set is faster
and more trustworthy.

## The open risk

The rest timer has to reach the user when they are not looking at the display,
and it is not yet settled what channel does that.

Meta's Web Apps documentation describes audio output as unavailable, which is
why the design assumes a bright full-viewport pulse instead. That works better
than it sounds: the display is an additive waveguide, so black is fully
transparent and the lens abruptly lighting up is hard to miss.

But the audio claim is now in doubt. A shipping fitness Web App on this device
appears to use WebAudio, pre-decoded audio and `speechSynthesis`, and audio is
absent from Meta's own list of unsupported capabilities. If sound works, the
cue should be a tone and the pulse becomes a backup.

Both are unproven, so [Phase 0](docs/05-roadmap.md) is a hardware probe that
tests audio first and the pulse second before anything else gets built. If
neither reaches the user, the fallback is the native Device Access Toolkit path,
which costs a companion mobile app.
