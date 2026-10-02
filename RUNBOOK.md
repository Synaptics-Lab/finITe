# RUNBOOK — reproducing the conformance run

Companion to [README](README.md) and [RECEIPTS](RECEIPTS.md). Everything here is
how the estate actually ran the suite on 2026-09-28/29/30; no step is invented.

## 0. Subjects under test (pinned)

- Estate Desktop Agent: `https://traderx.synapticchain.xyz/fdc3-agent.js` —
  frozen bytes, md5s in [RECEIPTS.md](RECEIPTS.md). **Do not touch the deployed
  bytes for a re-run** — the ×2 proof is against identical *deployed* bytes.
- App Directory v2 (live): `https://terminal.synapticchain.xyz/api/fdc3/appd/v2/apps?include=conformance`
  — 18 FINOS conformance records (verbatim per FINOS
  `static/directories/localhost-conformance.json`) + 2 estate records.
- Angular conformance host: `https://traderx.synapticchain.xyz/angular/conf.html`
  — serves the byte-identical frozen agent by reference (`../fdc3-agent.js`)
  and deliberately does NOT load the client-side `window.fdc3` stub
  (`bankerx-bridge.js`); a stub is not a conformant DA.

## 1. Agent boot URL protocol

The agent reads `directory` / `launcher` from `location.search`:

```
https://traderx.synapticchain.xyz/?launcher=1&directory=<appd URL with include=conformance>
```

The Angular host equivalent sets the DA via `__TRADERX_ANGULAR_DA_HOST` before
waiting on the agent — the agent global is set asynchronously after the
directory fetch, so any driver must wait on the *host marker*, not the global.

## 2. Serve the runner

```bash
cd runner/dist
npx http-server . -p 3001 -c-1 --cors
```

(`-c-1` = no cache; `--cors` = the runner fetches the directory cross-origin.)

## 3. Run the suite

- Open the runner page, select the **"All"** pack (basicSuite + advancedSuite
  = 132 tests).
- Completion criterion used by the estate harness: mocha stats frozen across
  two polls **12 s apart**.
- **Score from the DOM, never the stats bar**: mocha retry events overcount
  failures — the truthful per-test list is the DOM `.test.fail h2` elements.
  (Live example recorded in receipts: stats bar showed 4 fails where the DOM
  showed one test with 3 retried attempts.)

## 4. Harness-driven reproduction

`harness-example-conf-angular.js` is the persisted Playwright runner copy used
for the Angular runs: it asserts `__TRADERX_ANGULAR_DA_HOST` first, boots the
host, selects the All pack, waits on the frozen-stats completion criterion, and
dumps results. Drive it with playwright-core + Chrome headless:

```bash
npm i playwright-core
node harness-example-conf-angular.js
```

(Executable path in the harness points at a local Chrome install — adjust for
your box; anything that runs the page and the pack works, the runner is
plain web + mocha.)

## 5. Self-service click path (third-party verification gate)

The runner page is self-driving once served: select pack → click run → results
table. What is **verified to date**: estate harness-driven runs (documented in
RECEIPTS). What is **pending**: an unguided click-run by someone outside the
estate against the live agent + directory. Until a third party runs it, describe
the score as "estate-run, ×2, harness-driven" — not as "runnable by anyone in
one click". This repo exists to close that gate honestly.

## 6. Freeze rules (why this repo stays pinned)

- `runner/dist/` is frozen at the md5 recorded above. Upstream FINOS moves;
  *we don't move with it for a recorded claim*. A new upstream pin = new tag in
  this repo + a fresh ×2 run, never an in-place dist swap.
- Byte freeze through live demos: zero code edits to the agent while demo bytes
  are frozen; touching bytes re-opens the full ×2 discipline (conformance ×2 +
  E2E ×2, sequentially — the single-slot status relay is global across runs).
- The remaining disclosed failure is upstream's to fix
  (`RaiseIntentFailTargetedAppInstanceResolve1`; suite expects `NoAppsFound`,
  web-impl throws `TargetInstanceUnavailable`). Correct fix = upstream PR to
  `@finos/fdc3-web-impl`. Patching node_modules or faking the message string is
  forbidden — protocol lying.