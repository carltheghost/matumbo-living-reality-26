# maTumbo Social + Social Mirror: local slice v0.1

Status: implemented browser-local prototype. Not a public multi-user social network, not an authenticated social aggregator, not a completed production platform. It carries the gold/obsidian/teal visual direction but is not photorealistic or pixel-identical to the approved concept images.

## Run

Serve the repository over HTTP and open `/social.html`. No build or third-party JavaScript dependencies are required. Existing Reality, finance and contract engines are unchanged. The source page can link back to the existing `index.html`.

For a portable single file:

```sh
node scripts/build-social-standalone.mjs
```

Open the resulting `dist/maTumbo_Social_Mirror.html` in a modern browser. Some browser configurations restrict storage for local files. For reliable origin-based storage, serve the repository over localhost or HTTPS. The UI reports read/write failures rather than claiming a save succeeded.

## Implemented

- Local profile, native posts, exact-parent replies, likes, bookmarks, search and deletion.
- A combined local workspace for native content and saved external-source links, plus separate views.
- Source validation for 13 coverage targets: X, YouTube, Instagram, Facebook, Threads, TikTok, Snapchat, Reddit, Bluesky, Mastodon, Twitch, Discord and LinkedIn. The Mastodon source allowlist covers only three explicitly listed hosts; this is not universal federation.
- Unsent drafts tied to a particular saved source and optional original thread. Copying is separate from publishing. All external API capabilities remain false.
- Three local concept references: Pocket World, Genesis Slip Relic, Living Contract. No wager, payout, transfer, contract execution, media entitlement or NFT mint follows from sharing.
- An opt-in official YouTube iframe for validated video URLs. No player is loaded before the person chooses to load it. Playback may be blocked by the provider or the viewing environment.
- Actual procedural 3D coordinates projected onto a 2D canvas: hinged doors, small city geometry, rotation, inspection zoom and reset. This is not WebGL, a production world renderer or a connection to the existing Reality engine.
- Responsive desktop/mobile layout, keyboard-accessible controls, native dialogs, reduced-motion treatment and a compact view using the same social state.
- Versioned browser storage, duplicate-submit handling, local receipts, safe text rendering and JSON export. Unsent drafts and action history are excluded from exports unless explicitly selected.
- Local deletion redacts the affected receipt payloads as well as removing content. Retired request IDs cannot recreate deleted posts on retry.

## Boundaries and privacy

A saved link is not an authenticated account, verified identity or synchronized feed. No passwords, OAuth tokens or API keys are requested or stored. No provider adapters, OAuth backend, remote posting, inboxes, notifications, follows, public communities or cross-device sync are implemented. Network fetches are blocked by the page's Content Security Policy; an explicitly loaded YouTube iframe operates under the provider's own context.

Browser storage is not encrypted and is accessible to scripts running on the same origin. Do not store secrets or sensitive private conversations in this prototype. The profile is a local label, not access control. Browser/device compromise and same-origin scripts are outside this prototype's security boundary. Web Locks serialize this UI's mutations across tabs where supported; the fallback is not a distributed transaction system.

## Verification performed

`node --test tests/social-mirror.test.mjs`: **59 tests passed** locally. Coverage includes URL/host/credential rejection, exact thread routing, duplicate prevention, local state restoration, fake capability stripping, export privacy, removal redaction, storage write failure and prohibited financial/external actions.

**27 Chromium browser-harness checks passed** with no uncaught page errors. The harness rendered the exact generated single-file page in `about:blank`, using a mocked in-memory Storage implementation. Environment policy blocked localhost and file navigation; it was not disabled or modified. Thus these checks are not proof of disk persistence, a deployed site, actual provider authentication or successful live video playback. Serialized restoration into a new page was checked; the YouTube iframe response was intercepted in the test. Desktop and 390px mobile layouts were visually inspected.

The existing repository-wide test suite was not run locally in this environment; rely on the PR's CI for combined regression results. Local counts must not be represented as CI results.

## Next production work

Add a separately authenticated multi-user backend, persistent database and visibility enforcement; then implement provider-specific OAuth adapters with a server-side token vault, capability verification, revocation and per-destination receipts. Preserve the user's source/author/thread context and explicit approval for publishing. Only mark a capability connected after testing that authorized path. Integrate real scene assets and the existing Reality object graph without routing social reads or shares through financial execution.

## Technical reference

Official YouTube embed format checked against Google developer documentation: https://developers.google.com/youtube/player_parameters . This prototype uses a standard embed URL with autoplay disabled. It does not reproduce a signed-in YouTube home feed or confer paid content rights.
