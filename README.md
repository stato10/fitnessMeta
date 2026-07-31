# SetPace

A strength-workout runner for Meta Ray-Ban Display glasses. It shows the current
set and the rest countdown in the lens, so the user never picks up a phone
between sets.

Status: technical specification. No implementation yet.

## The idea in one paragraph

The user loads a workout plan before training. On the glasses they see the
current exercise, the target weight and reps, and their position in the workout.
They select once when a set is done, a rest countdown starts, the lens pulses
when rest is over, and the next set appears. Everything runs locally with no
network in the interaction loop, and there is no camera and no automatic rep
counting.

Built as a Meta **Web App**: standard HTML, CSS and JavaScript running
standalone on the glasses, with no companion mobile app.

## Spec

Read in order:

1. [Platform constraints](docs/01-platform.md) — verified hardware and SDK
   limits, and what follows from them
2. [Product definition](docs/02-product.md) — what the app does, what it
   deliberately does not, and the interaction model
3. [Architecture](docs/03-architecture.md) — data model, state machine, timer
   strategy, adapter port
4. [Edge cases](docs/04-edge-cases.md) — defined behaviour for every way this
   can go wrong, plus the open hardware questions
5. [Build plan](docs/05-roadmap.md) — phased, with the risky part first
6. [Setup and iteration](docs/06-setup.md) — official path to run a Web App on
   the glasses

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

Web Apps cannot play audio. The obvious design for a rest timer is a tone,
precisely because it reaches the user when they are not looking at the display,
and that option does not exist on this path.

The plan is a bright full-viewport pulse, which works better than it sounds: the
display is an additive waveguide, so black is fully transparent and the lens
abruptly lighting up is hard to miss. But this is unproven, so
[Phase 0](docs/05-roadmap.md) is a hardware spike that tests exactly this before
anything else gets built. If it fails, the fallback is the native Device Access
Toolkit path, which costs a companion mobile app.
