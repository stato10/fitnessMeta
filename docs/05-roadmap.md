# 5. Build Plan

Ordered so each phase is independently verifiable, and so the two questions that
could change the product get answered before most of the work is done.

## Phase 0 — Hardware probe

Done on real glasses (2026-07-31). Audio works; display sleeps; full-screen
flash works; circle flash does not. Probe moved to [`probe.html`](../probe.html);
checklist in [section 0](00-probe.md).

Answers the open questions in [section 4.5](04-edge-cases.md) in seven tests:
whether the platform can play a sound at all, whether a visual pulse works if it
cannot, whether the display survives a three-minute rest, and four smaller
questions about selection, legibility, focus and contrast.

Needs: glasses, a paired phone with Developer Mode enabled in the Meta AI app,
and any HTTPS host. [Section 6](06-setup.md) is the setup path.

Run it first. It is about 40 minutes of wearing the glasses and it de-risks the
product.

## Phase 1 — First playable build (in progress)

Shipped as root [`index.html`](../index.html): one hardcoded Push A plan, the
phase machine (Idle → SetReady → SetActive → Resting → Summary), wall-clock
rest, tone + full-screen flash on rest-over, keyed DOM focus, and
`localStorage` resume. Extracting pure TypeScript + table tests comes next
without changing the on-glasses behaviour.

## Phase 2 — DOM adapter / polish

Tighten focus survival, adjust-flow edge cases, and gym-tuned rest defaults
after a real workout on glasses.

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
| 0 | Is there sound at all, can a visual cue replace it, does the display stay awake | Yes |
| 1 | Is the logic correct under every edge case | No |
| 2 | Does it feel right, and does focus survive the countdown | No |
| 3 | Is the content model expressive enough for real workouts | No |
| 4 | Does it work in a real gym | Yes |
| 5 | Do we need the native path at all | Yes |

Phase 0 is small and gates everything. Phases 1 through 3 are the bulk of the
work and none of them are blocked on hardware.
