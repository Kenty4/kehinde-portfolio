# Bowen Hub — PWA

This folder is a complete, installable Progressive Web App: a manifest, a
service worker for offline caching, and app icons matching Bowen Hub's
design.

## Why you can't just double-click index.html for this part

Installability, geolocation, and the service worker all require the page
to be served over **HTTPS** (or `localhost`) — browsers block these APIs
on `file://` for security reasons. You need to host these 5 files
somewhere.

## Fastest way to get it on your phone (no cost, ~2 minutes)

**Option A — Netlify Drop (easiest, no account needed for a quick test)**
1. Go to https://app.netlify.com/drop on your computer
2. Drag this whole folder onto the page
3. You'll get a live `https://something.netlify.app` URL
4. Open that URL on your phone's browser

**Option B — GitHub Pages (if you already use GitHub)**
1. Push this folder to a repo
2. Repo Settings → Pages → deploy from the branch/root
3. You'll get a `https://yourname.github.io/repo` URL

**Option C — Vercel, Cloudflare Pages** — same idea, drag-and-drop or git push.

## Installing it once it's hosted

**Android (Chrome):**
Open the URL → you'll see an **"Install app"** button in the header (or
Chrome's own "Add to Home Screen" prompt in the address bar menu). Tap it.

**iPhone/iPad (Safari):**
Open the URL → tap the **Share** icon → **Add to Home Screen**. (iOS
doesn't support the automatic install prompt, so the page shows a banner
with these instructions.)

Either way, it now behaves like a real app: its own icon, opens without
browser chrome, and — thanks to the service worker — keeps working (with
cached data) if you lose signal.

## Files

| File | Purpose |
|---|---|
| `index.html` | The app itself |
| `manifest.webmanifest` | Name, icons, colors — what makes it "installable" |
| `sw.js` | Service worker — caches the app shell so it works offline |
| `icons/` | App icons at required sizes (192px, 512px, + maskable versions for Android) |

## Note on this being a demo

This still uses the same in-browser mock data as before (no real backend
calls) — installing it as an app changes *how it runs*, not *where its
data comes from*. Wiring it to the real Bowen Hub API is a separate step
once that backend is deployed somewhere reachable.
