# 6. Setup and Iteration

How to get a page from this repo onto Meta Ray-Ban Display glasses, and how to
keep changing it afterwards. Written for someone who owns the glasses, has them
paired to the Meta AI app, and has done nothing else for Web Apps.

## Sources

Primary (this file is grounded here):

- [Web Apps setup](https://wearables.developer.meta.com/docs/develop/webapps/setup/)
  — read 31 July 2026

Essential siblings one click away from that page:

- [Web Apps test](https://wearables.developer.meta.com/docs/develop/webapps/test/)
  — how to add, launch, reload, share, and record
- [Web Apps build](https://wearables.developer.meta.com/docs/develop/webapps/build/)
  — markup, viewport, capabilities, unsupported APIs
- [Wearables FAQ](https://developers.meta.com/wearables/faq/)
  — Developer Preview and publishing limits

There is no `/webapps/publish/` page (404 as of this writing). Publishing guidance
lives in the FAQ.

The Wearables MCP endpoint `https://mcp.developer.meta.com/wearables`
(`search_webapps_docs`) was not available in this environment; this file uses
the linked pages above.

Official steps are unmarked. Community reports and repo observations are labelled
**Community**. Gaps are labelled **UNKNOWN**.

## 6.1 Official overview (setup page)

Setting up to build Web Apps for Meta Ray-Ban Display (MRBD) takes three steps,
verbatim from the setup guide:

1. Check your hardware. Confirm your glasses, paired phone, and (optionally)
   Meta Neural Band meet the minimum requirements.
2. Check your Meta AI app and enable Developer Mode. Verify the app version on
   your phone, then put the app into Developer Mode so it can load Web Apps onto
   the glasses.
3. Prepare to host your Web App. Pick a hosting platform that serves your app
   over HTTPS so the glasses can load it.

## 6.2 Do this today — numbered checklist

| # | Step | Source | When |
|---|---|---|---|
| 1 | Confirm hardware is Meta Ray-Ban Display; Neural Band optional | Setup | One-time |
| 2 | Confirm glasses software is `v125`+ | Setup | One-time |
| 3 | Confirm Meta AI app is `v272`+ | Setup | One-time |
| 4 | Update glasses / app if below minimum | Setup | One-time if needed |
| 5 | Enable Developer Mode (tap App version five times) | Setup | One-time |
| 6 | Host the page at a public HTTPS URL | Setup | One-time, then loop |
| 7 | Optional: verify in desktop browser at 600×600 with arrow keys + Enter | Test | Loop |
| 8 | Add the Web App in Meta AI app | Test | One-time per URL |
| 9 | Launch from the glasses app grid | Test | Loop |
| 10 | After code changes: redeploy, then middle pinch → Restart | Test | Loop |

There is no Meta developer-account registration step on the Web Apps setup page.
The setup page never asks you to create an organization, project, or release
channel. Those belong to the Device Access Toolkit path, not Web Apps.

Realistic wall-clock time once versions are already current: on the order of
tens of minutes, almost all of it hosting and typing a URL. That duration is an
estimate, not an official figure.

## 6.3 Prerequisites

### Hardware (official)

- Web Apps are supported only on Meta Ray-Ban Display (MRBD) glasses.
- Meta Neural Band is optional, though recommended for an optimal experience.
- A paired phone running the Meta AI app is required (setup assumes the glasses
  are already paired).

**UNKNOWN:** minimum phone OS version (iOS / Android). Setup links the App Store
and Play Store Meta AI app pages but does not state OS floors. Use whatever OS
those store listings currently require.

**UNKNOWN:** minimum Neural Band firmware for Web Apps. Setup only says to keep
glasses and Band on the latest software.

### Software (official)

Download the Meta AI app from the App Store (iOS) or Play Store (Android) if you
have not already.

| Component | Minimum | How to check |
|---|---|---|
| Glasses software | `v125`+ | Meta AI app → **Devices** (glasses icon) → your device → gear → **Device settings** → **General** → **About** → **Release Version** |
| Meta AI app | `v272`+ | Meta AI app → **Settings** → **App Info** → **App version** |

If glasses software is below `v125`, check for glasses software updates from that
same device settings area. If the Meta AI app is older than `v272`, update from
the App Store or Play Store.

Setup quote: "For the best experience, always update your glasses and Meta Neural
Band with the latest software updates."

### Accounts and registration (official silence)

The Web Apps setup page does not require a Meta developer account, Wearables
Developer Center login, organization, or project registration to load a Web App.

**UNKNOWN:** whether any regional restriction applies specifically to Web Apps
Developer Mode. The FAQ restricts Wearables Developer Center / full Device Access
Toolkit capabilities by supported countries; it does not say the same about the
Meta AI app Developer Mode toggle used for Web Apps.

## 6.4 Enable Developer Mode

From the setup page:

1. Open the Meta AI app on your paired iOS or Android device.
2. Select **Settings** → **App Info**, then tap the **App version** number five
   times to display a pop-up that enables Developer Mode.
3. Click **Enable** to confirm.

Setup note: "Developer Mode persists across sessions, so you don't need to
re-enable it each time you open the Meta AI app."

Setup also states that Developer Mode unlocks the menu options used to load and
reload Web Apps on MRBD.

**Community (not official):** some developers report the five-tap gesture not
registering, needing extra taps, or needing Developer Mode toggled off/on and the
app force-quit before retrying. If the pop-up never appears, check the Meta AI
app version first (`v272`+).

## 6.5 Host the Web App

### Official requirements (setup page, verbatim where load-bearing)

- "Your Web App must be hosted on a publicly accessible HTTPS URL so MRBD can
  load it."
- "HTTP-only URLs are not supported. The glasses runtime requires HTTPS for every
  Web App URL it loads."
- Own server is fine "as long as it serves the app over HTTPS with a valid TLS
  certificate."

Named hosts on the setup page: Replit, Lovable, Vercel, GitHub Pages, Netlify,
Cloudflare Pages, or any static site host that serves over HTTPS.

Setup also notes: "While it's possible to point MRBD at any website, most sites
are not configured to work well within the platform's display and input
constraints." See the build guide for those constraints.

### Starter kit vs plain HTML

**A starter kit is not required.** The setup page never says you must use the AI
Coding plugin or any scaffold. It says you can point MRBD at any website, as long
as the URL is public HTTPS.

The optional [AI Coding plugin](https://github.com/facebookincubator/meta-wearables-webapp)
is mentioned on the setup page only as help for deploying to Vercel. The build
guide recommends it for AI-assisted development. Neither page makes it a gate to
loading a page on the glasses.

**A single self-contained `index.html` is enough to load**, provided it is served
at a public HTTPS URL. That follows directly from "point MRBD at any website."
No build step, package manifest, or companion app is required by the setup page.

Recommended (not required to load) markup from the build guide:

```html
<meta name="description" content="Description of your web app">
<meta name="mrbd-web-app-capable" content="yes">
```

Optional viewport lock from the build guide:

```html
<meta name="viewport" content="width=600, height=600, initial-scale=1.0, user-scalable=no">
```

### What setup does not specify

**UNKNOWN from the setup page:**

- Localhost / LAN URLs
- Tunnels (ngrok, Cloudflare Tunnel, etc.)
- Domain allowlists or URL registration with Meta
- Required HTTP response headers (CSP, CORS, Cache-Control)
- Content size or page-weight hard limits
- Whether a path other than `/` is allowed (assumed yes; not stated)

**Community / repo observation (not Meta setup text):** GitHub Pages often serves
HTML with a multi-minute `Cache-Control`, which slows the redeploy → glasses
reload loop. Prefer a host where you can set `Cache-Control: no-store` on HTML if
iteration speed matters. This is not stated on the setup page.

## 6.6 Add and open the Web App on the glasses

These steps are on the **test** page, linked from the setup hosting section and
required to complete the path. The setup page itself stops at hosting.

With Developer Mode already enabled:

1. Tap **App Settings** (left panel) → **App Connections**
2. Select **Web Apps** → **Add a Web App**
3. Add an app name and your HTTPS URL
4. Tap **Connect**

Official result: "Your Web App will appear immediately at the bottom of your
Meta Ray-Ban Display glasses app grid. You can then pin it for easier access."

Select the Web App on the glasses to launch it.

Input while inside the app (test page): up / down / left / right swipes and index
pinch or tap. A middle pinch opens a universal Web App menu with:

- **Restart** — reload the Web App
- **Resume** — return to the Web App
- **Permissions** — manage permissions if necessary

FAQ gesture summary for Neural Band: left / right / up / down swipes, enter with
index finger pinch, cancel with middle finger pinch. No custom Neural Band
gestures.

You add the app once per URL. Keep the URL stable across deploys so you do not
re-enter it.

## 6.7 Iteration / reload loop

There is no hot reload documented.

Official loop (test page):

1. Change the hosted files and redeploy so the public HTTPS URL serves the new
   content.
2. On the glasses, middle pinch → **Restart** to reload the Web App.

Optional pre-check (test page): open the same URL in a desktop browser, set the
viewport to 600×600, and drive it with arrow keys and Enter. "If it works on your
computer with up/down/left/right arrow keys and Enter, it should also work on
your glasses."

**UNKNOWN (official silence):**

- On-device JavaScript console / remote DevTools
- How to clear a stale glasses browser cache beyond Restart
- Whether JavaScript keeps running while the app is backgrounded or the glasses
  are off (Resume exists; lifecycle is otherwise undocumented)
- Pointing the glasses at a machine-local dev server without a public HTTPS URL

**Community mitigations for stale content (not official):** confirm the URL in a
desktop browser first; use a host with `Cache-Control: no-store`; as a last
resort temporarily change the URL query string (requires editing the Meta AI app
entry).

## 6.8 Desktop preview and sharing

### Desktop (test page)

Web Apps run in ordinary browsers. Chrome DevTools viewport 600×600 is the
documented preview method. There is no Web Apps simulator. The Mock Device Kit
is for the Device Access Toolkit and, per the FAQ, does not currently support
display glasses.

### Sharing (test page + FAQ)

1. Meta AI app → **App Settings** → **App Connections**
2. Tap your Web App
3. Tap **Share link**

Recipients with Developer Mode enabled are one tap from adding it; others are
asked to enable Developer Mode first.

FAQ: during Developer Preview you can share a Web App by URL; you cannot yet
distribute to end users via open publishing.

### Recording (test page)

- Meta AI app → **Devices** → MRBD → **Record Display**
- Or from the glasses settings pane → **Display Recording**

## 6.9 Developer Preview caveats

From the FAQ (not the setup page body):

- "Developer Preview means you can build and test experiences, but you cannot
  yet distribute them to end users."
- "Publishing is currently not available during the Developer Preview phase."
- While publishing is unavailable, Web Apps can still be shared by URL; Device
  Access Toolkit uses release channels.

Setup page itself does not expand on Developer Preview beyond the product being
in that phase on the broader site.

From the build guide capability list, Web Apps do **not** yet support:

- Camera
- Microphone
- Text Input
- Offline Support
- Notifications
- Back Navigation

Also: no continuous cursor support.

Audio output / speakers are not named on the setup page. The build unsupported
list names microphone but not speakers. Project assumption that Web Apps cannot
play sound comes from broader platform docs and FAQ capability framing, not from
a verbatim setup-page sentence. Treat speaker access on the Web Apps path as
**unsupported / not documented as available** unless a later official page says
otherwise.

## 6.10 What this means for this repo

Phase 0 is not blocked on Meta approval or a starter kit.

Exact sequence for today:

1. Check glasses ≥ `v125` and Meta AI app ≥ `v272`.
2. Tap **App version** five times → Enable Developer Mode.
3. Publish `index.html` (or the folder that contains it) to any public HTTPS host.
4. Meta AI app → **App Settings** → **App Connections** → **Web Apps** →
   **Add a Web App** → name + URL → **Connect**.
5. Open it from the glasses app grid.
6. After each change: redeploy, then middle pinch → **Restart**.

**Single-file `index.html` is enough** to load on the glasses. The AI Coding
plugin is optional tooling, not a prerequisite.

Biggest practical blocker if versions are already current: getting a stable
public HTTPS URL and surviving host/glasses caching during the reload loop. If
versions are behind, the glasses firmware update is the only step that can take
a long time.
