# 5. Build Plan

Ordered so each phase is independently verifiable, and so the two questions that
could change the product get answered before most of the work is done.

## Phase 0 — Hardware spike

A throwaway page that does three things: fills the viewport with a bright pulse
on a timer, renders text at the planned sizes, and puts three 88 px focusable
buttons on screen.

Answers the open questions in [section 4.5](04-edge-cases.md), above all whether
a visual pulse can replace the rest-over tone the platform will not give us.

Needs: glasses, a paired phone with Developer Mode enabled in the Meta AI app,
and any HTTPS host.

Do this first. It is a few hours of work and it de-risks the product.

## Phase 1 — Core

`src/core/` : types, `validatePlan`, `reducer`, `render`, tick scheduler.

Pure TypeScript. No DOM, no `localStorage`, no `Date.now()`. Time arrives as a
`now: () => number` argument.

Done when the state machine from [section 3.6](03-architecture.md) runs under
unit tests and every case in [section 4](04-edge-cases.md) has a passing table
test. A correctness milestone with nothing to look at.

## Phase 2 — DOM adapter

`src/adapters/dom/` : the keyed diff and focus preservation from
[section 3.8](03-architecture.md), D-pad focus handling, `localStorage`
persistence, and the rest-over pulse.

Developed in Chrome at 600x600 with a keyboard, which is the same input the
glasses deliver. Focus survival across ticks is the acceptance test.

## Phase 3 — Plans and validation

`src/plans/` : several real workout plans as JSON, with `validatePlan` wired
into CI so an unrenderable plan fails the build rather than the glasses.

## Phase 4 — On-glasses

Deploy to an HTTPS host, add the required `mrbd-web-app-capable` meta tag, load
via Developer Mode, and run a real workout.

Worth using Meta's [Web Apps starter kit](https://github.com/facebookincubator/meta-wearables-webapp),
which ships a Cursor plugin, and the Wearables MCP endpoint at
`https://mcp.developer.meta.com/wearables` with its `search_webapps_docs` tool,
since the platform is in Developer Preview and these docs move.

## Phase 5 — Native path, only if forced

`src/adapters/dat/` exists only if Phase 0 shows the visual cue is not good
enough and audio becomes mandatory. That means a companion iOS or Android app,
which is a large step up in cost.

The core does not change. `Frame` already maps onto DAT's component set, and the
budgeted tick policy described in [section 3.5](03-architecture.md) moves into
that adapter.

## What gets proven when

| Phase | Question it answers | Needs hardware |
|---|---|---|
| 0 | Can a visual cue replace sound, and does the display stay awake | Yes |
| 1 | Is the logic correct under every edge case | No |
| 2 | Does it feel right, and does focus survive the countdown | No |
| 3 | Is the content model expressive enough for real workouts | No |
| 4 | Does it work in a real gym | Yes |
| 5 | Do we need the native path at all | Yes |

Phase 0 is small and gates everything. Phases 1 through 3 are the bulk of the
work and none of them are blocked on hardware.
