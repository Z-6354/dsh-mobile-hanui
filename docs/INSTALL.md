# Installing dsh-mobile-hanui

This document is written so that an AI agent (or a human) can install and wire
this plugin into a DeepSeek Harness (DSH) deployment from scratch, with no
prior context.

## 1. What it is

`dsh-mobile-hanui` is a **client-side only** DSH plugin that turns the DSH web
GUI into a phone-friendly layout under a narrow viewport (`max-width: 1023px`).
It is a pure-JS plugin — there is no build step and no compiled `lib/` output;
the whole implementation lives in `src/client.js`.

It depends on nothing at runtime except the DSH client runtime itself and the
standard DSH client UI layout plugin (declared via `dsh.client.inject`).

## 2. Dependencies / requirements

- A running DSH `web` profile (the `dsh web` server that serves the web GUI).
- The DSH client plugins already bundled in that profile — specifically
  `@deepseek-ai/dsh-client-runtime` and `@deepseek-ai/dsh-client-ui-layout`,
  which are always present in the standard `@deepseek-ai/dsh-web-app` bundle.

No npm dependencies, no transpilation, no postinstall.

## 3. Install (method A — git clone as a linked dependency)

This is how it is deployed in this repository's own setup.

1. Clone the plugin:

   ```bash
   git clone https://github.com/Z-6354/dsh-mobile-hanui.git /data/dsh-mobile-hanui
   ```

2. Find the DSH `web` profile's `package.json`. With default DSH it is at
   `~/.dsh/profiles/web/package.json` (the profile directory is
   `$DSH_HOME/profiles/web`; `$DSH_HOME` defaults to `~/.dsh`).

3. Add the plugin as a linked dependency and to the profile bundles:

   ```jsonc
   {
     "name": "dsh-profile-web",
     "private": true,
     "dependencies": {
       "dsh-mobile-hanui": "link:/data/dsh-mobile-hanui"
     },
     "dsh": {
       "profile": {
         "bundles": [
           "@deepseek-ai/dsh-base",
           "@deepseek-ai/dsh-web-app",
           "dsh-mobile-hanui"
         ]
       }
     }
   }
   ```

4. Install (the profile uses pnpm):

   ```bash
   cd ~/.dsh/profiles/web && pnpm install
   ```

5. Restart the DSH web service so it re-scans the profile and serves the new
   client bundle. For a systemd-managed service:

   ```bash
   sudo systemctl restart dsh-web
   ```

6. Reload the web GUI in a phone-width viewport (or a phone). The mobile shell
   activates automatically at `max-width: 1023px`.

## 4. Install (method B — npm)

Once published to npm, install by name instead of a `link:` path:

```bash
cd ~/.dsh/profiles/web
pnpm add dsh-mobile-hanui
```

Then add `"dsh-mobile-hanui"` to `dsh.profile.bundles` (same as method A step 3)
and restart the web service as in step 5.

## 5. How it loads (for AI readers)

- `package.json` → `dsh.client` declares `platform: "web"` and
  `inject: ["@deepseek-ai/dsh-client-runtime", "@deepseek-ai/dsh-client-ui-layout"]`.
  DSH's `client-modules` scanner turns this into a boot-manifest entry and serves
  the client bundle at `/plugins/dsh-mobile-hanui/client.js`.
- The client bundle `src/client.js` registers itself via
  `window.__ModuleLoader__.load({ id: "dsh-mobile-hanui", factory })`.
- The host side is a no-op stub; `cordis.patch.yml` only inserts an empty host
  entry so the client-modules scanner can discover the package's `dsh.client`
  declaration.

## 6. Disable at runtime

- Add `?mobileShell=0` to the URL, or
- `localStorage.setItem('dsh-mobile-shell', '0')` and reload.

## 7. Troubleshooting

- **Mobile layout not applying**: confirm the browser viewport is `<= 1023px`
  and that the boot manifest (view page source) contains an entry whose `id` is
  `dsh-mobile-hanui`. If missing, the profile bundles change did not take — check
  `pnpm install` and the service restart.
- **Client bundle 404**: the package must be resolvable from the profile's
  `node_modules` (a `link:` or npm install must have created the symlink).
