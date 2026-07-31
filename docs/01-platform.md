# 1. Platform Constraints (Verified)

Every design decision in this spec traces back to a real hardware or SDK
constraint. This file is the source of those constraints. If something here is
wrong, the design downstream is wrong too.

Sources: Meta Wearables developer documentation
([Web Apps build guide](https://wearables.developer.meta.com/docs/develop/webapps/build),
[display overview](https://wearables.developer.meta.com/docs/develop/dat/display-overview)),
the [Meta wearables FAQ](https://developers.meta.com/wearables/faq/), and the
[Meta Horizon OS developer blog](https://developers.meta.com/blog/build-for-display-glasses/).
Both build paths are in Developer Preview.

## 1.1 Hardware

| Property | Value | Design consequence |
|---|---|---|
| Display | Monocular, right lens only, 600x600 px, ~20 deg FOV, additive waveguide | Roughly 3-4 readable lines. Black renders as fully transparent. |
| Camera | 12MP stills, 1440x1920 video @30fps | Native path only. Points forward, away from the wearer. |
| Audio | 2 open-ear speakers, 5-mic array | Works from a Web App in practice (verified on-device, see 1.4). Meta docs disagree. |
| Input | Meta Neural Band (surface EMG) + captouch strip on the temple | Becomes arrow keys and Enter. Nothing else. |
| Link | Bluetooth to the phone; Wi-Fi 6; 32 GB storage | Web Apps load over HTTPS from a public URL. |
| Battery | ~6h mixed use, ~24h with the case | Bursty display use is fine, continuous sensing is not. |

## 1.2 Choosing a build path

**Web Apps** run standalone on the glasses. Standard HTML, CSS and JavaScript,
served from a public HTTPS URL, loaded via Developer Mode in the Meta AI app.
No companion app, no app store, no native code.

**Device Access Toolkit (DAT)** is a native iOS (Swift) / Android (Kotlin) SDK
that extends an existing mobile app onto the glasses, and is the only path with
camera, microphone and speaker access.

**This project targets Web Apps.** The gym use case needs no camera and no
microphone, and the standalone deployment removes an entire companion-app
codebase. Section 1.4 covers the one capability that makes this a real trade
rather than a free win.

## 1.3 Web Apps: verified capability set

Supported:

| Capability | Detail |
|---|---|
| Display | Additive waveguide overlay. Fixed 600x600 px viewport. Avoid scrolling. |
| Input | Neural Band and captouch translate to `ArrowUp` / `ArrowDown` / `ArrowLeft` / `ArrowRight` / `Enter` keyboard events. All interactive elements must be focusable. |
| Sensors | `DeviceMotionEvent` and `DeviceOrientationEvent`, standard W3C APIs. Requires a permission grant from a user gesture. |
| Location | `navigator.geolocation`, sourced from the paired phone. |
| Storage | `localStorage` and `sessionStorage`, 5 MB each. |

Explicitly **not** supported: camera, microphone, text input, offline support,
notifications, back navigation, and any form of cursor.

Audio output belongs on that list according to Meta's Web Apps overview, but it
does not appear in the capabilities table itself, and there is evidence it works
anyway. See 1.4.

Required markup:

```html
<meta name="mrbd-web-app-capable" content="yes">
<meta name="viewport" content="width=600, height=600, initial-scale=1.0, user-scalable=no">
```

```css
body { width: 600px; height: 600px; overflow: hidden; }
```

Documented UI minimums: body text at least 16 px, primary content 20-24 px, and
focusable elements at least **88 px tall**.

## 1.4 Audio — verified on device

Meta's Web Apps material says Web Apps cannot play sound. That claim is wrong
for this hardware in Developer Preview, or at least incomplete.

**On-device probe result (user, 2026-07-31):** sound from the probe was audible
through the glasses speakers. Treat WebAudio (and whatever path the probe used)
as available for the rest-over tone.

Re-check after major firmware or Meta AI updates — the docs still disagree, so
the capability may regress. Until then, audio is the primary rest cue.

A bright full-viewport flash remains the secondary cue for noisy gyms
([section 2.7](02-product.md)). Expanding-circle / small-shape flashes were
easy to miss; full-screen flash was noticed.

## 1.4a Display sleep — verified on device

**On-device probe result (user, 2026-07-31):** the display did turn off during
idle / long wait. Do not design as if the lens stays lit for a full rest.

Consequences:

- Timers stay wall-clock deadlines ([section 3.4](03-architecture.md)), so the
  remaining time is correct the moment the display wakes.
- On `visibilitychange` / resume, re-render immediately and fire the rest-over
  tone if the deadline already passed while asleep.
- Do not rely on the visual countdown alone. The tone (and a secondary flash
  when waking into an overdue rest) is the load-bearing signal.
- Keep trying `wakeLock` if present, but do not depend on it — sleep still
  happened in the probe session.

## 1.5 The input model in full

There is no mouse, no touch screen and no keyboard. Gestures produce exactly
five events. The documented pattern is a D-pad focus ring over elements carrying
a `.focusable` class:

```js
const DPAD = { UP: 'ArrowUp', DOWN: 'ArrowDown', LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', SELECT: 'Enter' };
```

Arrow keys move focus between focusable elements; `Enter` activates the focused
one. Meta's sample code also maps `Escape` to `history.back()`, but back
navigation is on the unsupported list, so **nothing in this app may depend on a
back gesture**. Every action must be reachable as a visible focusable element.

The middle pinch is reserved by the OS: it opens a system menu offering Restart,
Resume and Permissions ([section 6.7](06-setup.md)). It never reaches the page,
so nothing may be bound to it. It is also the reload control for the whole
development loop.

Two consequences worth stating plainly, because they drive the UI design:

**Focus is the entire interaction model.** Whatever is focused when the user
performs a select gesture is what happens. Getting the default focus right is
not a polish detail, it is the primary interface.

**Element count per frame is tightly bounded.** At an 88 px minimum height in a
600 px tall viewport, once the content block is accounted for there is room for
two, at most three, actions. This is a hard budget, not a guideline.

## 1.6 What follows from this

**The default-focused action must be correct without looking.** The most likely
next action is focused on every frame, so a blind select always does the right
thing. This is what makes the device usable with a barbell in your hands.

**No back gesture means undo must be on screen**, and can only exist in phases
where there is screen budget and time for it.

**No offline support means load everything up front.** The app is fetched from
an HTTPS URL. Nothing may be fetched during a workout, and state must survive a
reload through `localStorage`.

**Bright on black, large type.** Not a theme choice. Black is transparent and
the display competes with a gym's ambient light.

## 1.7 Note on the DAT path

If this project ever needs the native path, the relevant semantics differ in one
important way: DAT's `send()` / `sendContent()` **replaces the entire display
with no partial update mechanism**, using a fixed component set (`FlexBox`,
`Text`, `Image`, `Button`, `Icon`, `Video`). The architecture in
[section 3](03-architecture.md) keeps a pure `render(state) -> Frame` function
specifically so that this remains an adapter swap rather than a rewrite.
