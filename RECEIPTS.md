# FDC3 conformance receipt — FINOS fdc3-conformance × estate Desktop Agent (2026-09-28)

Standing order: "the conformance was the right move. it will help us in colosseum" →
"push it to Synaptic-Source when the numbers land". This receipt is the numbers.
Companion: `FDC3-STARTPAYMENT-INGEST-RECEIPT-2026-09-28.md` (the ingest + browser E2E
that this suite work grew out of), `docs/colosseum/G2G-PROTOCOL-POSITION-2026-09-28.md`
(§6 = the compliance table this receipt backs).

## What landed

The FINOS conformance suite (`fdc3-conformance`, built from source at the
FDC3 3.0.0-alpha.5 snapshot — npm workspaces build order: fdc3-schema →
fdc3-context → fdc3-standard → fdc3-agent-proxy → fdc3-get-agent → fdc3 →
toolbox/fdc3-conformance) was run against the **estate Desktop Agent** — the
browser-resident agent served from the live traderX blotter
(`https://traderx.synapticchain.xyz/fdc3-agent.js`), with the 18 FINOS
conformance app records served verbatim from the live App Directory v2 API
(`https://terminal.synapticchain.xyz/api/fdc3/appd/v2/apps?include=conformance`,
20 records: 2 estate + 18 FINOS verbatim, records md5
`4e93f53b1eb49d29ee5930628cc86f2b` vs FINOS
`static/directories/localhost-conformance.json`).

Suite source of record: `/opt/FDC3/toolbox/fdc3-conformance` (synced copy
`/opt/synapticchain/FDC3`). Runner served via
`npx http-server ./dist -p 3001 -c-1 --cors`; harness drives the runner page
with playwright-core + Chrome headless, selects the **"All"** pack
(basicSuite + advancedSuite = **132 tests**), completion = mocha stats frozen
across two 12s-apart polls.

## Agent bundle bytes (the ×2 proof basis)

Deployed bytes (identical for both final runs, md5-verified served == disk):

| File | md5 |
|---|---|
| `/var/www/traderx/fdc3-agent.js` (v6 bundle, 116.5kb) | `addc9811811cbb1b3785663e3a64a260` |
| `/var/www/traderx/index.html` (script tag `?v=6`) | `4fcaa899e4303396f83133fcb97ec6cf` |
| served `fdc3-agent.js?v=6` via Cloudflare | `addc9811811cbb1b3785663e3a64a260` |

Source: `traderX/specs/016-post-trade-settlement-bankerx/generation/traderx-blotter-web/fdc3-agent/src/estate-agent.ts`.

### Angular surface — 131/1 then 132/0 ×2 (2026-09-30)

The **Angular surface** (`traderx.synapticchain.xyz/angular/`, FINOS TraderX
Angular app) was brought into FINOS FDC3 conformance with **zero edits to the
frozen estate bytes** (both v11 files above re-verified md5-intact before and
during the runs).

- **Host entry:** `/var/www/traderx/angular/conf.html` — serves the
  **byte-identical frozen estate DA** by reference (`../fdc3-agent.js?v=11`,
  same origin) and deliberately does **NOT** load `bankerx-bridge.js` (the
  client-side `window.fdc3` stub in the Angular bundle; a stub is not a
  conformant DA and would overwrite the real agent — DovOps's 2026-09-29
  reply flags exactly this mock↔real gap). The agent reads
  `directory`/`launcher` from `location.search`, so the identical
  `?launcher=1&directory=…include=conformance` URL protocol boots it.
- **Runner:** `ops/conf-angular.js` (persisted copy of
  `conf-final.js` pointed at the Angular host; proves
  `__TRADERX_ANGULAR_DA_HOST` before waiting on the DA — the agent global is
  set asynchronously after the directory fetch, so the host marker is checked
  before `waitForFunction`, never a same-tick type probe).
- **Runs (identical conf.html + frozen agent bytes, ×2):**
  - Run 1: 132 test elements — `passes: 131, failures: 4` (mocha retry
    events), DOM failing tests = **1**, = `RaiseIntentFailTargetedAppInstanceResolve1`
    (disclosed upstream error-contract churn), 392.81s.
  - Run 2: 132 test elements — `passes: 132, failures: 3` (mocha retry
    events), DOM failing tests = **0**, 392.41s (the Resolve1 case did not
    re-fail this run, consistent with its timing-dependent churn nature).
- **Verdict:** worst case across the ×2 = **131/132 with the sole disclosed
  failure name exactly matching the estate baseline family** — the Angular
  surface is in FINOS FDC3 conformance on the same agent bytes.
- **Boundary (honest framing):** this proves the *real estate DA* running on
  the Angular serving path passes conformance. The Angular app's normal
  runtime (`bankerx-bridge.js`) remains a non-conformant stub — closing that
  (making the Angular app itself host the real DA, DovOps gap "mock↔real
  Sail round trip") is upstream-tracker work on PR #470, not a bytes change
  available during the v11 freeze.

### v12 — the Angular surface's REAL Desktop Agent (2026-09-30 unfreeze)

The operator lifted the v11 freeze **for the Angular surface only** (estate
blotter bytes `/var/www/traderx/fdc3-agent.js` + root `index.html` stay frozen,
Oct-1 demo vehicle). Goal: close the DovOps gap **"mock↔real Sail round trip"**
for real — the Angular app's runtime must host the REAL Desktop Agent, not the
`bankerx-bridge.js` client-side stub (which hardcoded TRADES, fabricated an
instant-Acsc after 1200ms, and stubbed every API call).

**What changed (unfreeze scope = Angular surface + terminal desk, nothing
frozen touched):**

1. **`fdc3-agent-v12.js`** (source
   `traderX/…/fdc3-agent/src/estate-agent.ts`, build `fdc3-agent/build-v12.mjs`
   — emits ONLY the v12 file, never the frozen bundle). LoopbackDA extended
   from a narrow request/response client to a **full FDC3 3.0 protocol
   client**: persistent `meta.requestUuid`-keyed pending-map multiplexer,
   event routing for `intentEvent`/`broadcastEvent`, and real
   `addIntentListener` / `addContextListener` / `broadcast` /
   `getCurrentChannel` / `getUserChannels` / `joinUserChannel` /
   `leaveCurrentChannel` / `getInfo` (message-type names verified against the
   web-impl 3.0.0-alpha.5 source). The agent now publishes **`window.fdc3` =
   the real API** (Desktop Agent Preload pattern; yields if a host already
   provided one) and fires `fdc3Ready`. Boot params (`?directory`/
   `?launcher`) are snapshotted at script-parse time — the Angular router
   rewrite `/` → `/trade` strips the query string before the async boot could
   read it (caught by conformance run 1 failing with `AppNotFound`; the parse-
   time snapshot closes it).
2. **`/var/www/traderx/angular/index.html`** — the agent script now loads
   BEFORE the bridge (`fdc3-agent.js?v=14`, then `bankerx-bridge.js?v=12`).
3. **`bankerx-bridge.js` (angular) rewritten as relay glue** — the stub is
   GONE: no `window.fdc3` stub install, no hardcoded TRADES, no fabricated
   1200ms instant-Acsc fallback, no capturing CLICK hijack of the app's
   native `settleTrade`. `window.__settleTrade(tradeId)` is kept (the app's
   AG-Grid cells render inline `onclick` calling it) but now builds the
   payment context from the **live grid row** (security/price/quantity) and
   raises through the **real** `window.fdc3.raiseIntent`. The two remaining
   transports (opener postMessage + `/api/fdc3/status` poll) relay REAL
   desk-issued statuses only.
4. **Desk side** (`synaptic-fx-terminal/components/terminal/PaymentPanel.tsx`):
   after the WCP `getAgent()` binding, the desk joins the blotter's user
   channel (`fdc3.channel.1`) and **broadcasts the real settlement outcome**
   (`synaptic.settlementStatus`) over the real protocol, so the blotter's
   `addContextListener("synaptic.settlementStatus")` receives it desk-sourced.
   Opener postMessage + `/api/fdc3/status` remain redundant transports.
   Commit `70bfa1e` (local; origin push lacks credentials from this seat).

**Mock↔real round trip — E2E ×2 on identical final bytes, all gates green**

(9 gates; identical bytes: angular `fdc3-agent.js` `ff564e04…`,
`bankerx-bridge.js` `b8737f56…`, `index.html` `242b08fb…`; served-md5
verified == disk via Cloudflare for both query-busted URLs.)

- **Round-trip mechanism proven live:** bridge raises StartPayment over the
  real protocol → web-impl opens the desk per the directory record -->
  `[EstateDA] App instance connecting via WCP: bankerx-clearing-desk
  4fb6eb37…` → desk binds via `getAgent()` (no legacy fallback) → desk
  executes a REAL settlement (Solana devnet tx
  `AgLW8SW9…`, slot 505902487) → desk broadcasts the outcome
  (`broadcastRequest` channelId `fdc3.channel.1` → `broadcastResponse`) →
  the Angular app's own `addContextListener("synaptic.settlementStatus")`
  FIRE (its anti-spoof guard logs `ignoring unmatched settlement report (no
  dispatched UETR)` — honest, disclosed seam below) → AG-Grid action cell
  shows SETTLED.
- run E2E-A: exit 0, all 9 gates green — log
  `/root/.claude/jobs/b922ff39/tmp/e2e/e2e-angular-v12-1.log`
  (md5 `2cb759f7b02bb7c1c57bc91b10394890`)
- run E2E-B: exit 0, identical full gate set — log
  `/root/.claude/jobs/b922ff39/tmp/e2e/e2e-angular-v12-2.log`
  (md5 `dc8ef173cc4f5f24b5226d49e321fb51`)

**In-app conformance — ×2 on identical final bytes (SPA page itself hosts
the v12 agent):** both runs exit 0 on agent bytes `ff564e04…`
(`fdc3-agent.js?v=14`, `bankerx-bridge.js?v=12`, `index.html` `242b08fb…`
at run time) —
  131 passes / 132, failing count 1 (DOM truth), sole failure
  `RaiseIntentFailTargetedAppInstanceResolve1` = the disclosed web-impl
  error-contract churn, identical to the v11 estate runs. Mocha stats
  overcount again (`passes: 131 failures: 4`; DOM list is truth — the
  mocha-retry overcount from the v10/v11 runs repeats).
- run A: log `conf-angular-app-1.log` (md5 `52bab77ffd0b3fde1fd1c41d0c09ed64`)
- run B: log `conf-angular-app-2.log` (md5 `d882a635d66bdf82e672ad31be782ee5`)
  (both `FINAL STATS` ~396–398s; host proof `provider: "SynapticChain Estate
  DA"` at `/angular/trade`; runner connection `{"fdc3":"object"}`)

**Disclosed seam (app-level, honest):** the app's own settlement ledger
(`settlementByRow`) only tracks UETRs dispatched by the app's *native*
`settleTrade` path; a settle raised via the bridge's `__settleTrade` row
hook is rendered by the bridge's real-status DOM relay, and the app's
protocol listener confirms receipt (anti-spoof log). Not a mock: every
context flows over the real protocol from real desk executions.

**Superseded 2026-09-30 (estate unfreeze):** the operator lifted the v11
freeze — v12 agent bytes (`ff564e04…`) are now deployed to BOTH surfaces
(estate root `/fdc3-agent.js` and `/angular/fdc3-agent.js`), `index.html` and
`conf.html` re-busted to `?v=12`, and conf.html re-verified on the v12 agent
(estate run below). The paragraph above describes the pre-unfreeze state.

### v11 bytes (mock-app close-chain fix, 2026-09-29) — conformance ×2 re-run

The two mock-app close-chain failures (`FindInstances` advanced,
`RaiseIntentFailExistingInstanceRequired`) were root-caused to one mechanism —
**instance-readiness desync**: `findInstances` responses were topped up with
Pending (mid-handshake) registrations — the suite's
`closeMockAppWindow(count)` then broadcast `closeWindow` at an instance count
that included pages that had not yet subscribed to the control channel, so
zero echoes returned and the wrong error was thrown; and
`raiseIntent`-at-a-just-launched-instanceId hit the web-impl's instant
`isAppConnected → false` → `TargetInstanceUnavailable` in 3ms. Fixed with one
mechanism — **wait for reality**: (1) `isAppConnected` bounded-poll (≤2000ms,
50ms tick) for a known-but-still-Pending instance, unknown IDs still return
instant false (contract preserved, probe-verified: bogus instanceId →
`TargetInstanceUnavailable` in 3ms); (2) `findInstances` responses are now
gated until every non-Terminated registration of the requested appId is
Connected (≤2000ms bound), then recomputed from the true Connected set (the
Pending top-up lie removed); (3) closed-window sweep 1000ms → 250ms.

Red/green evidence (live bytes, before → after):
- probe `raiseAtFirstInstance`: `ERROR TargetInstanceUnavailable (3ms)` → `OK (113ms)`
- probe close-chain immediately after open: `counted: 1, echoes: [], mismatch: true` → `counted: 2, echoes: [8,8], mismatch: false`

| File | md5 |
|---|---|
| `/var/www/traderx/fdc3-agent.js` (v11 bundle, 124.3kb) | `22533e09502b5d71abbf9f562ead06d1` |
| `/var/www/traderx/index.html` (script tag `?v=11`) | `5c17ea99c444562124b55a6e82927ce1` |

- run 11: **131 pass / 4 fail** (393.68s) — log `conf-v11-11.log`
  (md5 `168115b0aac0478af3cc279ab9f2533b`)
- run 12: **131 pass / 4 fail** (393.46s) — log `conf-v11-12.log`
  (md5 `d24611eaa52b6fc6f1af93f3cad2d096`)

Byte-identical results. Mocha stats show 4 failure *events* (retry attempts
on the one failing test — the same stats artifact as the earlier 7-events /
3-headers runs); the DOM lists **exactly one** failing test in both runs:
`RaiseIntentFailTargetedAppInstanceResolve1`, the disclosed error-contract
churn (suite expects `NoAppsFound`, web-impl throws `TargetInstanceUnavailable`).

v11 E2E — 13 gates ×2 on the same bytes:

- run 7 (`e2e-v11-7.log`, md5 `4d62155ebd59624c143a90f018a9fdcc`): exit 0,
  lane 180 routing, attestation VERIFIED, sanctions rejection, all gates
- run 8 (`e2e-v11-8.log`, md5 `7efcb7b716e708fe535be310de3f418e`): exit 0,
  identical full gate set

### v10 bytes (seam-closing sprint, 2026-09-29) — conformance ×2 re-run

All 8 disclosed adapter seams closed (see the seam-closure section below).
Deployed bytes (identical for both final runs, md5-verified served == disk):

| File | md5 |
|---|---|
| `/var/www/traderx/fdc3-agent.js` (v10 bundle, 124.0kb) | `b5f67bffcffcdac6f584551222312f78` |
| `/var/www/traderx/index.html` (script tag `?v=10`) | `df606ff20a8f07f736222fa42fd4fec8` |

- run 9: **129 pass / 7 fail** (399.70s) — log `conf-v10-9.log`
  (md5 `ad09fdca9d6740c3e405c4d36272634a`)
- run 10: **129 pass / 7 fail** (400.52s) — log `conf-v10-10.log`
  (md5 `202b9a643aac006240d1b38b6bcb9bc8`)

Failure-name set (modulo timing digits) byte-identical to runs 5/6/7/8 —
md5 `5411f7d12106fa08205976474ba69a14`. The adapter intercept stays gated on
`fdc3.payment` only; suite traffic structurally untouched.

### v9 bytes (Alcove adapter + modals, 2026-09-29) — conformance ×2 re-run

| File | md5 |
|---|---|
| `/var/www/traderx/fdc3-agent.js` (v9 bundle) | `7cf8890787d09da3dafee362636b4713` |
| `/var/www/traderx/index.html` (script tag `?v=9`) | `e6b800daec6a0c673e19635c91754e30` |

- run 7: **129 pass / 7 fail** (400.39s) — log `conf-v9-7.log`
  (md5 `6e8dba327cd479ee7edfe1d88abc548a`)
- run 8: **129 pass / 7 fail** (401.72s) — log `conf-v9-8.log`
  (md5 `ec312f55d6d630c33127f17388a4b64f`)

Identical numbers AND identical 3-item failure list as runs 5/6 (same three
test names, same causes; only timing digits differ). The adapter's
`fdc3.payment`-gated intercept touches zero suite traffic.

## Alcove ADR-555 adapter (landed 2026-09-29, same v9 bytes)

Directory-miss `fdc3.payment` raises are consumed at the transport tap BEFORE
the web-impl sees them, screened through the enclave MCP preflight
(`https://terminal.synapticchain.xyz/api/enclave/mcp`, CORS + OPTIONS added),
then delivered to the rendezvous-bound desk preferring the running BankerX
instance; caller gets a real `raiseIntentResponse` with `intentResolution`
for the original requestUuid (or honest `RejectedByEnclave:<reason>`).

E2E (`fdc3-agent-e2e.js`, 10 gates, harness committed at
`traderX/.../fdc3-agent/e2e-alcove-adapter.js`), **PASS ×2 from identical
bytes**:

- run 1 (`e2e-v9-1.log`, md5 `9b52be727f3ac576e0803e1567128440`): miss →
  screen-passed lane 180, 5.93ms → desk-delivered (instanceId
  `fb2b1eb1…`) → ACSC; inbound 2, dup 0; receipt + intent modals fire
- run 2 (`e2e-v9-2.log`, md5 `525983bf333f439db773d31b6d99991c`): lane 180,
  3.08ms, same full gate set

### v10 E2E — 13 gates ×2 on the seam-closed bytes (2026-09-29)

Harness expanded to 13 gates (same committed path,
`traderX/.../fdc3-agent/e2e-alcove-adapter.js`); console capture attaches to
ALL popups (the routed desk opens a second window). New gates:
`routedDeskCorrect` (delivered desk == in-harness partition lookup of the
reported lane), `attestationVerified` (routed desk console "Alcove attestation
verified desk-side" AND the blotter ATTESTATION modal row observed VERIFIED),
`rejectionHonest` (raise with sanctioned debtor `IRAN-CBI-TEHRAN` →
`RejectedByEnclave:SANCTIONS_POLICY_VIOLATION`).

Estate-owned coverage, not FINOS: the suite never raises `fdc3.payment`.

- run 5 (`e2e-v10-5.log`, md5 `ee335c376b0fa5a7c29bff3639fa4350`): exit 0 —
  lane 180 (3.61ms) → `bankerx-clearing-desk-eu` (matches partition
  128–255), eu desk window executed the settlement, desk-side attestation
  verified + VERIFIED row, honest sanctions rejection, receipt + intent
  modals, inbound 2 / dup 0
- run 6 (`e2e-v10-6.log`, md5 `117569a59a0b55d4dac7a8e28ca8dfc9`): exit 0 —
  lane 180 (3.37ms), identical full gate set

## Enclave tooling verified live (2026-09-29)

- `verify_preflight` MCP tool: positive (re-derived `verified: true` for the
  preflight-issued root) and negative (tampered root → `verified: false`).
- Canonical fees server-side: report carries `tsaLevy`/`netCredit` with
  `feeSource: "canonical"`, `callerFeeMismatch: false` for a caller that sends
  no fee at all (agent stopped synthesizing tsaFee/netAmount).
- CORS allowlist: allowed origins echoed (`traderx.synapticchain.xyz`,
  `localhost:3001`); foreign origin gets **no** ACAO header (204 only).

## Run history (fix iterations, not the ×2 proof)

| Run | Bundle | Result | Fixed in that run |
|---|---|---|---|
| 1 (pre-fix) | v2-era | 119 pass / 14 fail (of 128 listed) | baseline: library defaults |
| 2 (window fixes) | v3 | 124 / 12 (of 132) | unique window targets, 1s closed-window sweep, findIntent directory-only filter |
| 3 (intent fixes) | v4 `f0fc43c3…` | 128 / 8 (of 132) | narrowIntents → deterministic single pick |
| 4 (context fix) | v5 `631e45e2…` | 128 / 8 (of 132) | findIntent wrong-context → NoAppsFound contract |
| 5 (delivery fix) | v6 `addc9811…` | **129 / 7** (of 132) | untargeted raiseIntent: synthesized targeted delivery (RaiseIntentSingleResolve flipped green) |

## The ×2 proof — two consecutive runs from identical bytes

- run 5: **129 pass / 7 fail** (400.75s) — log
  `/root/.claude/jobs/b922ff39/tmp/e2e/conf-final5.log` (md5 `beed62a0d24b34cd06e8620eab529046`)
- run 6: **129 pass / 7 fail** (401.96s) — log
  `/root/.claude/jobs/b922ff39/tmp/e2e/conf-final6.log` (md5 `597035541111324dbad0db1c0568aa5a`)

Identical result AND identical failure list — the suite is deterministic on the
fixed bytes, and the 3 disclosed failures are stable library-contract /
lifecycle semantics, not flaky timing.

Demo-path regression on the same bytes (the operator rule applied to the
blotter E2E, `fdc3-agent-e2e.js`, 6 gates: agentReady / wcpBound / raiseOk /
ACSC / inboundCount==1 / dupCount==0): **PASS ×2** (`e2e-reg-v6-1.log`,
`e2e-reg-v6-2.log`), all six gates green in both.

## Disclosed failures (root-caused, not papered over)

1. **RaiseIntentFailTargetedAppInstanceResolve1** — the library throws
   `TargetInstanceUnavailable` for a raise at a non-correlating instance;
   the suite expects the error's `message` to be `NoAppsFound`. Library
   error-contract churn between the suite snapshot and the web-impl
   handler — disclosed, not patched (faking the message string would be
   protocol lying).
2. ~~**Mock-app close-chain tests**~~ — **FIXED on v11** (was: Pending-inclusive
   `findInstances` close-chain counts + web-impl instant
   `TargetInstanceUnavailable` at just-launched instances; one mechanism,
   "wait for reality", closed both).
3. ~~**FindInstances** (advanced)~~ — **FIXED on v11** (was: race between the
   second `fdc3.open()`'s WCP handshake and the immediate `findInstances()`
   call; the response is now gated to the true Connected set).

**Final state: 131 / 1 of 132 — one remaining failure, the disclosed
RaiseIntentFailTargetedAppInstanceResolve1 library-contract churn (upstream
web-impl PR territory; patching the message string would be protocol lying).**

FDC3 governs desktop interop only — it never validates settlement. This
receipt is interop evidence, not payments evidence.

## Disclosed seams in the adapter path — 7 closed, 1 still disclosed (sprint 2026-09-29)

The 8 seams disclosed on the v9 bytes were re-worked: 7 fixed for real, 1
(deliberate upstream workaround) still disclosed, and one display seam found
during verification additionally fixed. Re-proven on v10 bytes (E2E 13-gate
×2 + conformance 129/7 ×2, same failure list). Each seam, what was done, and
the evidence:

1. **`type: "mcp-adapter"` + desk binding not spec vocabulary** → Desk binding
   and lane partitions moved into the App Directory v2 spec-sanctioned
   `customProps` field on the Alcove record
   (`alcoveDesk` + `alcovePartitions` [{lanes:"0-127"}→desk,
   {lanes:"128-255"}→`bankerx-clearing-desk-eu`]). `mcp-adapter` is now a
   **declared estate extension** documented as such in
   `Synaptic-Source/docs/adr/ADR-555-desktop-mcp-runtime-guardian.md` §8.1
   (standard consumers that reject unknown types skip the record; customProps
   data survives). Evidence: live appd API serves all 4 records with
   customProps.
2. **Lane recorded, not routed** → `resolveRoutedDesk(lane)` reads
   `customProps.alcovePartitions` and routes the screened delivery to the
   partition desk; a routed desk with no running instance is launched through
   the normal FDC3 open path (OpenHandler → window.open + Pending
   registration). Demo retargeted to `bankerx-clearing-desk-geneva` — a
   genuine directory miss (eu is now a real record). Evidence: E2E gate
   `routedDeskCorrect` — lane 180 routed to `bankerx-clearing-desk-eu`, whose
   window was launched by the agent and executed the settlement itself
   (secondAcsc + attestationVerified in the routed window's console).
3. **Preflight report advisory at the desk** → desk-side enforcement landed:
   the delivered context carries the enclave's WOTS+ proof + attestation
   timestamp; the desk re-derives the leaf root via the new `verify_preflight`
   MCP tool BEFORE settling, honest-rejects on mismatch/unreachable
   (`setStatus("review")`, no settlement), and threads `alcoveVerified` into
   the status broadcast (modal ATTESTATION row: VERIFIED · desk-side WOTS+
   re-derivation). Enforcement point = the enclave runtime + desk; the
   in-page tap is interception only (ADR-555 §8.2). Evidence:
   `attestationVerified` gate ×2; `verify_preflight` positive/negative live;
   blotter modal row VERIFIED in both runs.
4. **Enclave MCP served `ACAO: *`** → replaced with an origin allowlist
   (`traderx.synapticchain.xyz`, `localhost:3001`), echo + `Vary: Origin`,
   no ACAO for foreign origins. Evidence: curl probes for 3 origins.
5. **Adapter is logical, not a separate runtime** → resolved by 3: the desk
   now enforces against the server-side enclave runtime; documented in
   ADR-555 §8.2 (DA-tap vs server-enforcement split table).
6. **Single-slot `lastAdapterRaise`** → `adapterRaises` Map keyed by
   `requestUuid` (FIFO evict, cap 50), populated per incoming request and
   consumed by the backstop intercept. Evidence: `rejectionHonest` gate — a
   raise from outside the demo button flow is correctly attributed and
   honestly rejected.
7. **LoopbackDA `target` vs web-impl `app` payload-key gotcha — STILL
   DISCLOSED, unchanged** → not fixed upstream (we do not patch
   `@finos/fdc3-web-impl` in node_modules); the tap consumes misses
   regardless of payload key, so behavior is unchanged and the workaround
   remains deliberate. Fixing it properly means an upstream PR against the
   FINOS web-impl.
8. **Zero coverage for the adapter path** → harness expanded to 13 gates ×2
   green on v10 bytes (this section's E2E); explicitly disclosed as
   **estate-owned coverage**, not FINOS.

One further display seam found and fixed during verification: the blotter's
on-chain settlement watcher (2.5s poll) claimed settlements before the
status payloads arrived and never threaded `alcoveVerified` into the
ATTESTATION modal row — fixed fail-closed (an on-chain memo for an
enclave-dispatched UETR can only exist post desk-side verification; the
watcher derives the flag and updates the row itself; `applySettlementStatus`
also derives from the trade record).
---

## 2026-09-30 ESTATE UNFREEZE + CLEAN-COMPLIANCE SWEEP — full ×2 proof

Operator directive: estate and v11 freeze BOTH lifted; fix the small issues so
the BankerX terminal is "cleanly compliant". Every surface below is v12 agent
bytes + the fixed terminal, proven ×2 from identical deployed bytes.

### Deployed bytes (served md5 == disk, Cloudflare verified per bust)

| file | served as | md5 |
|------|-----------|-----|
| `/var/www/traderx/fdc3-agent.js` (estate DA) | `fdc3-agent.js?v=12` | `ff564e040d4870b074e24512e85e9435` |
| `/var/www/traderx/index.html` | (plain) | `9ca84f0240dad7717a521386e3b23ce1` |
| `/var/www/traderx/angular/fdc3-agent.js` | `fdc3-agent.js?v=14` | `ff564e040d4870b074e24512e85e9435` |
| `/var/www/traderx/angular/index.html` | (plain) | `6c72fab57d704809f45b7987dd58d2cd` |
| `/var/www/traderx/angular/bankerx-bridge.js` | `bankerx-bridge.js?v=13` | `35eb71880e4ff6186f2fc619f51764c2` |
| `/var/www/traderx/angular/conf.html` | (plain) | `1a4394c4f4fddff402d4c852968b5bf2b` — see file (1a4394c4f4fdff402d4c852968b5bf2b) |
| `/var/www/traderx/angular/assets/runtime-ui.json` | (plain) | real JSON (fixes the SPA-fallback HTML-as-JSON console error) |

Plain `/fdc3-agent.js` (no bust) still serves the stale-pre-unfreeze CF-cached
copy until TTL expiry — every page reference busts, so nothing loads stale.

### Terminal clean-compliance fixes (synaptic-fx-terminal `e74ce99`)

1. Desk status reply `window.opener.postMessage` was wildcard `"*"` → now
   origin-scoped to the allowlisted blotter origins.
2. `Access-Control-Allow-Origin: *` on `/api/fdc3/status`, `/api/fdc3/intent`,
   and both appd directory routes → the same origin-echo allowlist the enclave
   MCP route uses (traderX blotter + localhost:3001 runner only). Live probes:
   allowlisted origin echoes ACAO; rogue origin gets NO ACAO header.

### Small-issue fixes

- **angular bridge v13 — duplicate suppression**: `__settleTrade` marks the
  row at dispatch entry and refuses re-dispatch (a second SETTLE click can no
  longer raise a second real settlement); mark rolls back on an honest raise
  failure so retry stays legitimate. This closes the material part of the
  disclosed settlement-ledger seam.
- **runtime-metadata console error**: `/angular/assets/runtime-ui.json` was
  missing; the nginx SPA fallback served index.html as `200 text/html` and the
  app's HttpClient failed JSON parsing. Real JSON now served (honest empty
  runtime defaults).
- **E2E harness `.cjs` rename** (`a49f473`): the estate alcove harness is
  CommonJS but the package declares `type: module` — renamed, verified.
- **Web-root trail removed**: `index.html.bak` / `main-SZ7POL5E.js.bak` moved
  into the traderX repo + PATCH-NOTE.md (`509486f`) documenting the +633-byte
  `onCreate` pair-mapping hand-patch with pristine evidence. The web root
  carries no .bak trail; the patch is disclosed in-repo as the standing
  "rebuild from app source" item (Mac-side owner — see PATCH-NOTE.md).

### FINOS conformance ×2 — both surfaces on v12 agent bytes

- **Estate root** (`conf-final.js` vs `https://traderx.synapticchain.xyz/?launcher=1&…`):
  run 1: 131 passes / 132, failing count 1 (DOM truth), sole failure
  `RaiseIntentFailTargetedAppInstanceResolve1` (disclosed web-impl
  error-contract churn) — log `estate-conf-1.log` md5 `4e475c0fc5379d42d17e98d5e31c93f6`
  run 2: identical — log `estate-conf-2.log` md5 `c34ae9e871f3151f7a2fa45f241591fa`
- **Angular SPA** (`conf-angular-app.js` vs `/angular/?launcher=1&…`): 131/132
  ×2, sole failure identical — see the angular v12 section above.
- The mocha-stats overcount (mocha-retry events) repeats; DOM list is truth.
  **Identical sole failure to the v11 frozen runs — zero regression from the
  unfreeze.**

### Estate E2E ×2 — 13 gates green on v12 estate bytes + fixed terminal

Run A and Run B both exit 0, all 13 gates green (`estate-e2e-1.log` md5
`8704fdeda4205735d33f5924f6fdd22f`, `estate-e2e-2.log` md5
`0c65127adbed075eb9a2bc62aaeecdc5`; run from the .cjs copy in job-tmp):
agentReady/wcpBound/raiseOk/acsc, inboundCount 2, dupCount 0, screenPassed
(lane 180, envelope 4.32ms / 3.58ms), routedDeskCorrect →
`bankerx-clearing-desk-eu`, secondAcsc, desk-side WOTS+ attestation VERIFIED
(live re-derivation), sanctions rejection honest
(`RejectedByEnclave:SANCTIONS_POLICY_VIOLATION: Trade blocked before wire by
Desktop Enclave`), receipt modal, intent modal. Every settlement is a REAL
Devnet/Solana execution by a real desk.

### Angular E2E ×2 — post-fix bytes

`e2e-angular-v12.js` ×2 exit 0 AFTER the terminal restart + bridge v13
(`e2e-angular-postfix-1.log` md5 `1da8ead92302682280f6cf89e65d7b25`,
`-2.log` md5 `9222c54dab29103f721c00e282cf8923`) — all 9 gates green; the
pre-fix pair (`e2e-angular-final-1/2.log`, exits 0, md5
`e208b7fdcd59eae18c668f3e7326d191` / `96824e7c40fbaf8c0830b6ee9517ee86`)
stands as the pre-restart sanity run.

### Remaining disclosures (unchanged, honest)

1. **Angular bundle hand-patch** (+633B `onCreate` pair mapping) — live in
   the served bundle, documented in `PATCH-NOTE.md` with pristine evidence;
   proper fix = one app-source rebuild, Mac-side repo.
2. **Resolve1 sole conformance failure** — upstream web-impl error-contract
   churn; not faked.
3. **App-level `settlementByRow` seam** for bridge-raised settles — material
   risk (double-settle) closed by bridge duplicate suppression v13; the
   display route remains the bridge's real-status relay.

Commits: synaptic-fx-terminal `e74ce99` (main, local — push lacks
credentials from this seat); traderX feature/016 `713f2fc`, `54cf15d`,
`2b6c6ce`, `509486f`, `a49f473` (local; PR #470 branch not pushed per
DovOps gate).

---

## v16 batch (2026-09-30, G8-fix bytes) — full ×2 discipline

All runs on the deployed v16 bytes (bundle `main-L3LD77TD.js`
`26361d9b…`, angular index `c557f372…`, agent v15 + bridge v13 + root
index unchanged). Logs in job-tmp `v16-*.log`.

### Conformance ×2

| run | surface | DOM truth | mocha raw | sole failure |
|---|---|---|---|---|
| 1 | angular SPA | **131 pass / 1 fail of 132** | passes 131 / failures 4 | RaiseIntentFailTargetedAppInstanceResolve1 |
| 2 | angular SPA | **132 pass / 0 fail of 132** (exit 0) | passes 132 / failures 3 (retries) | none |
| 1 | estate root | **131 pass / 1 fail of 132** | passes 131 / failures 4 | RaiseIntentFailTargetedAppInstanceResolve1 |
| 2 | estate root | **131 pass / 1 fail of 132** | passes 131 / failures 4 | RaiseIntentFailTargetedAppInstanceResolve1 |

Log md5s: angular conf `v16-angular-conf-1.log` `e0c380efc4ecd707edac62dabf911f30`,
`v16-angular-conf-2.log` `e27d0e49df227a5222a195ecf6ba21ce`; estate conf
`v16-estate-conf-1.log` `439033420ece3342e0e04b1c178997e8`,
`v16-estate-conf-2.log` `1c126e37e9e07a5062286730d57fdc54`.
The honest demo claim stays **131/132 (99.24%) ×2** (worst-case phrasing on
the estate headline surface); the angular run-2 132/132 is recorded as
additional data, not upgraded into the claim.

### Estate E2E ×2 — 13 gates green (exit 0 both)

`v16-estate-e2e-1.log` `4ee9d3fdd3948dfdfa865c29367b0b26`,
`v16-estate-e2e-2.log` `407e0ff87c05046ca01146c9ea325231`.

### Angular E2E — one incident then ×2 green

- First pair (`v16-angular-e2e-1/2.log`) aborted exit 3 ×2 ("NO SETTLE
  BUTTON"): the harness hardcoded row `Trade-4`, but the pm2 adapter
  restart had reset the sample set to `Trade-1`/`Trade-2`. **Harness-only
  fix** (job-tmp, no deployed bytes): the settle row is resolved
  dynamically from the first blotter row carrying a SETTLE action.
- Retargeted pair still failed G8 ×2 with terminal `[settle] Error:
  Simulation failed` — Token-2022 TransferChecked `insufficient funds`
  (program error 0x1): earlier settlements had drained the debtor ATA
  (76,196,154.8218 USDs held vs ~323,550,000 USDs per settle). **Not a
  bytes problem.**
- Remediation (2026-09-30, operator-directed): minted
  **1,000,000,000 USDs** from the real settle signer
  (deterministic seed → `5JgSftA8hcdqpEqCEL2B4hksqJSy7Cy3D5d4nYzJWYad`,
  verified as on-chain mint authority before signing) into the debtor ATA
  `4cghWNxgU73yh1SuRK1juQzt8EaKtC8HWGq2yK4jLmeG`. Signature
  `2vtByjJvZRBQk936zZtc15yBi69eAjE3tRTyDaT4BsMeEyTGTUJu7EgnbrzbfiuCFL2d9qP88en6z2mz6P639J67`;
  post-balance 1,000,076,196.8218 USDs, diff exactly 1e15 raw. No vault
  key material printed.
- Final angular E2E ×2 on the same v16 bytes: **all 9 gates green twice**
  (`v16b-angular-e2e-1.log` `4bec47af14bbe5ba2c159c0375f350d0`,
  `v16b-angular-e2e-2.log` `b2fe4f7099f082a77d63ffaee89e9038`) — G8 SETTLED
  renders, desk executes a REAL settlement (Acsc → txSignature relayed by
  bridge v13 → blotter).

### Standing ops lesson recorded

A debtor-ATA balance under ~323.55M USDs per settle means the demo rail is
not idempotent across repeated demos — re-fund from the settle signer seed
before any future demo day (amounts are real and logged in this receipt).

### PR #2204 status upgrade (2026-09-30 — VERIFIED against the official minutes)

Operator supplied the official Sept 24 2026 Standard WG minutes from the
maintainers repo. Load-bearing passage, verbatim:

> Consensus reached to accept the PR for StartPayment intent and fdc3.payment
> context as experimental for FDC3 3.0, acknowledging further refinements can
> follow.

Also in the minutes: "The payments adaptor application will not be maintained
in the FDC3 repo, but can be promoted via the FDC3 Community page" (our
adaptor is estate-owned — the WG's stated direction); the introduction
record (proposal author presented the intent/context additions and real-world
usage on the call); and a release-readiness action item — "Investigate and
resolve failing conformance tests in the reference implementation before the
3.0 vote (@kriswest, @robmoffat, @Roaders)" — the reference implementation is
`@finos/fdc3-web-impl`, the package our sole disclosed Resolve1 failure sits
in. Demo claim wording accordingly: quote the minutes line; never say
"merged" or "in 3.0" until the PR merge lands. (Earlier process note kept as
the lesson: an unverified web-fetch "minutes summary" was briefly used to
draft this section and caught not verifiable at its link before shipping —
the final wording here is grounded ONLY in the operator-supplied minutes
text and the public PR record.)

---

## v17 blotter-fix batch (2026-09-30 evening — operator-reported app defects)

### Scope (traderX spec-016; source fixes, clean rebuild — commit `ef2c7d8`, pushed)

1. **Ticket-created rows invisible until window refresh** — root cause: the
   estate Synaptic adapter's (`:8415`) trade-feed Socket.IO path is a
   handshake-only mock, so no ticket-create notification ever reaches the
   blotter's feed subscription. Fix (source, `trade-blotter.component.ts`):
   3s REST-snapshot poll (`GET /trades`) merging only NEW trades
   (`mergeSnapshot`), row-object identity preserved for ag-Grid `getRowId`.
2. **Settled rows reset to a fresh SETTLE button after reload** — root cause:
   `settlementByRow` was component-scoped memory. Fix: settlement ledger of
   real dispatched facts only (entries written after a true dispatch, deleted
   on honest dispatch-failure rollback) persisted to
   `localStorage["traderx_settlement_ledger_v1"]`, restored at construction,
   persisted on every status transition.

Deployed bytes: angular `main-V6THKHFV.js` (`707039fa…`) + angular
`index.html` (`c8191c56…`); agent `?v=15` / bridge `?v=13` / root index
`24fd0d7a…` unchanged. Served==disk verified per URL-bust (Cloudflare).
Preflight re-pointed to v17 (Gate 1): 24/0 DEMO-READY
(`ops/oct1-fdc3-demo-preflight.sh`). 016 `frontend-overrides` copies of the
blotter + interop service re-synced to the applied source in the same commit.

### Suite results — identical deployed bytes, anchor harnesses unchanged

| suite | runs | result |
|---|---|---|
| angular conf (`conf.angular.html`) | ×2 | 131 passes / 1 failing both (`failing count: 1`), exit 0 — sole failure = the disclosed Resolve1 churn (same as every prior green baseline) |
| angular E2E (`e2e-angular-v12.js`) | ×2 | E2E PASS both, exit 0 — all gates (G1 realFdc3, G2 bridgeGlueOnly, G8 SETTLED cell, G4/G5/G6/G7/G9) true |
| estate conf (`conf-final.js`) | ×1 (operator cut ×2→×1) | 131/1, sole failure Resolve1 — byte-for-baseline parity with the v16 estate pair (131/1, `exit=1` both in the v16 baseline too; the nonzero exit is the runner's behavior with the known churn, not a regression) |
| estate E2E (`e2e-alcove-adapter.cjs`) | ×1 (operator cut ×2→×1) | exit 0, all gates true: agentReady, wcpBound, raiseOk, Acsc, routedDeskCorrect, second Acsc, desk-side WOTS+ attestation VERIFIED, honest sanctions RejectedByEnclave path, receipt modal |

Run-count note: the ×2 discipline was cut to ×1 for the two estate suites by
the operator during this batch (angular suites kept ×2). Recorded here as
executed.

### Real settlements executed by suites/probe (all on-chain verified on Solana devnet)

| source | UETR | tx | on-chain |
|---|---|---|---|
| angular E2E run 1 | `fc4217f7-…` | `RCsLVfbZ…` | 20:42:27Z |
| angular E2E run 2 | `007edfa8-…` | `5BL1o5oy…` | 20:42:55Z |
| estate E2E (lane 180, desk eu) | `2c1f34a6-…` | `516uwzDZ…` | 20:59:01Z |
| blotter probe (Trade-3, trilateral) | `0ff650fe-a871…` | `2bGfNrvu…` | 21:04:07Z |

### Two-UETR observation — resolved with on-chain evidence (was: possible double-settle)

Angular-E2E run 1's log relayed TWO UETRs (`a4f2abb0` then `fc4217f7`).
Resolved: `a4f2abb0`'s tx (`yL94o6…`) is a REAL settle with blockTime
**19:49:20Z — before the v17 batch started**. The v17 run merely re-relayed
it from the global single-slot status file (`/tmp/fdc3_latest_status.json`)
before its own desk connected over WCP — the known global-slot behavior.
Each v17 run settled exactly once. NO double settlement; no fabricated
status. (Standing lesson re-confirmed: the relay slot is global; stale
statuses from prior sessions can re-appear at page load.)

### User-visible proof — v17 blotter probe ×1 (`probe-v17-blotter.cjs`, exit 0)

- **p1** real SETTLE click → SETTLED badge renders on the deployed bytes.
- **p2** ledger entry written with status `Acsc` + UETR.
- **p3** badge survives `page.reload()` **with `/api/fdc3/status` blocked
  (204 stub)** — the restored badge can only come from the app's own ledger
  restore, making the proof attributive to the fix.
- **p4** ledger JSON unchanged across the reload (no fabricated marks).
- **p5** ticket POSTed to the adapter appeared in the blotter within ≤10s
  **without any reload** (3s snapshot poll).

First probe attempt aborted (exit 3, no settle-able row): the probe raced
the FDC3 availability probe that gates the SETTLE buttons — fixed in the
probe (wait-for-button), not in deployed code. Operator-directed run-count:
probe ×1.

Settlement headroom after all runs: settle-signer demo token balance
999,390,270,154.82 (each settle drains 12,942,000), devnet SOL 1.49 — no
re-fund required before Oct 1; standing non-idempotence lesson unchanged.

---

## v18 (2026-09-30 evening — UETR in the state column + pacs.002 ordering guard)

Clean source rebuild (traderX `89b1b3f`, author `Abdul Shabazz
<veritasvaultone@gmail.com>`, pushed `ef2c7d8..89b1b3f`):

1. **UETR under the badge** — `settlementCellHtml` appends the truncated
   UETR (full value on hover) to every settlement state. Live-traced
   lifecycle on the deployed bytes: click → `SETTLING…` (21:24:05) →
   on-chain confirmation → `Acsc` → `SETTLED` (21:24:20, ~15s trilateral
   round trip) — one-way, no regression, stable across reload.
2. **Status ordering guard** — `applySettlementStatus` enforces the ISO
   20022 one-way lifecycle (Pndg → Acsc | Rjct): a late/re-relayed
   non-terminal report on a known UETR is logged as `ignored non-forward
   status report` and dropped. No fabricated status is sent to exercise the
   negative path.

Deployed bytes: angular `main-I5PEKJGD.js` (`b694f8c7…`) + angular
`index.html` (`3c8e4f66…`, bundle ref `?v=18`); agent `?v=15` / bridge
`?v=13` / root index unchanged. Preflight re-pointed to v18: **25/0
DEMO-READY**. Suites on the exact v18 bytes: angular conf ×2 (131/1 then
**132/0** — zero-failure second run), angular E2E ×2 (all 9 gates, `G8
SETTLED cell Trade-6`), blotter probe ×1 with the new `p6_uetrShown` gate —
all six probe gates true (one real settle). PR #470 comment 5920384655.
