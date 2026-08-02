# SetPace

A machine guide + leveled strength workouts for Meta Ray-Ban Display.
Learn gym machines on the lens, then run sets and rest countdowns hands-free —
not just another rep counter.

Status: Playable — Train + Machines home —
https://stato10.github.io/fitnessMeta/

## vs simple rep counters

Apps like GymRep are great at counting reps/sets and resting. SetPace is built
for the other half of the gym floor: **what this machine is**, **how to set it
up**, and **a short plan to follow** at Beginner or Intermediate weight.

| | GymRep-style counters | SetPace |
|---|---|---|
| Focus | Rep / set tally | Machine guide + workout runner |
| Rest timer | Often counts up | Counts down · tone + flash |
| Teaching | Little / none | GIF demos + short step cues |
| Plans | Hardcoded list | Full body / Upper / Legs · leveled |
| Machines | No library | Browsable machine guide → Train this |

## The idea in one paragraph

Home offers **Train** or **Machines**. Train: pick a focus, level, and equipment,
then SetPace teaches each new exercise (Beginner always; Intermediate can skip
what you’ve already learned) and runs set + rest so you never pick up a phone.
Machines: browse leg press, chest press, lat pulldown, and more — see what it
trains, setup tips, and a motion GIF demo, then **Train this** for a quick
2-set block. Demo GIFs ship with the app (curated from
[exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset);
media © [Gym visual](https://gymvisual.com/)). No camera, no live form
checking, no automatic rep counting.

Built as a Meta **Web App**: standard HTML, CSS and JavaScript running
standalone on the glasses, with no companion mobile app.

## Run it

- **Workout (product):** https://stato10.github.io/fitnessMeta/
- **Hardware probe:** https://stato10.github.io/fitnessMeta/probe.html

On glasses: Home → Train (goal → level → equipment) or Machines (browse →
detail → Train this). Arrows move focus; Enter selects. Middle pinch closes the
app. Probe findings (audio works, display sleeps, full-screen flash works) are
in [docs/04-edge-cases.md](docs/04-edge-cases.md) §4.5.

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
