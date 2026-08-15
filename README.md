# dsh-mobile-hanui

Standalone mobile UI shell for the DeepSeek Harness Web GUI, extracted from
`han-relay` so mobile layout adaptation lives as its own plugin.

## What it does

Activated under a narrow viewport (`max-width: 1023px`, i.e. phones), it:

- Pins the center column to the full-width grid track and turns the desktop
  three-column layout (sidebar | chat | details) into a single-column phone UI
  with left drawers.
- Adds a **draggable FishLogo FAB** to open the sidebar drawer, plus a backdrop
  to close it (tap / swipe-left / Escape).
- Turns the session sidebar and details panel into left drawers that slide over
  the chat instead of squeezing it.
- Auto-loads earlier history when you scroll to the top of the conversation
  (mobile-only infinite scroll; desktop keeps the manual "load earlier" button).
- Suppresses the soft keyboard that the InputBar would otherwise auto-open on
  every session switch; the keyboard only appears when you actually tap the
  composer.
- Makes the subagent catalog trigger reachable and its dropdown a full-width
  sheet instead of a clipped absolute popover.
- Keeps the `ask_user_question` composer panel (user-selection flow) visible and
  full-width on phones.
- Adapts the new-session hero: centered logo/headline with the input bar docked
  at the bottom like a normal conversation.
- Fits the model-selection and reasoning-effort popovers (removes the
  `overflow` clipping that hid them).
- Compact message footer, stats line, input bar, and session header for phones.

## Loader

- Client face is auto-scanned via `dsh.client` (see `package.json`).
- Host face is a stub; the bundle patch (`cordis.patch.yml`) only inserts an
  empty host entry so `client-modules` can discover the client bundle.

## Install

See [docs/INSTALL.md](docs/INSTALL.md) for a step-by-step installation and
wiring guide (git-linked dependency or npm), plus a loader/troubleshooting
reference written for AI agents.

## Disable

Add `?mobileShell=0` to the URL or set `localStorage['dsh-mobile-shell'] = '0'`.
