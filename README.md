# finITe

**The FINOS FDC3 conformance suite, pinned and run against the SynapticChain
Estate Desktop Agent — receipts, re-run path, and byte-identity, in one repo.**

> 🖥️ The desktop agent this suite runs against is live for Colosseum Radar judges at
> **[colosseum.synapticchain.xyz](https://colosseum.synapticchain.xyz)** — clearinghouse console,
> nine-stage live-fire demo (`/demo`), Continuous Atomic Netting (`/can`), position brief (`/brief`),
> and milestone receipts (`/milestones`). Verification fast-path: [JUDGES_FLOW.md](https://github.com/Synaptics-Lab/synaptic-fx-terminal/blob/main/JUDGES_FLOW.md).

Headline result: **131 passed / 1 failed (of 132)** — proven **twice on identical
deployed bytes**, served md5-verified before and between runs. The single failure is
`RaiseIntentFailTargetedAppInstanceResolve1`, an error-contract defect in the
**upstream** `@finos/fdc3-web-impl` reference library (suite expects error
`NoAppsFound`, the reference library throws `TargetInstanceUnavailable`); the FDC3
Working Group has reference-implementation conformance failures on its named
pre-3.0-vote fix list, and we deliberately do not patch around it locally —
faking the message string would be protocol lying.

## What this is — and what it is not

- **It is:** FINOS's `fdc3-conformance` runner (Apache-2.0, unmodified), built
  from source at the **FDC3 3.0.0-alpha.5** workspace snapshot (package version
  `3.0.0-alpha.2`), with the estate Desktop Agent
  (`https://traderx.synapticchain.xyz/fdc3-agent.js`) as the implementation under
  test. Every one of the 132 tests is FINOS-authored; our artifact is the graded
  subject and the receipts.
- **It is not:** FINOS certification, endorsement, or approval. The 131/132 is our
  own run of FINOS's own public instrument. We say "131 of 132, twice on identical
  bytes" and nothing stronger.

## Provenance

| Artifact | Identity |
|---|---|
| Suite source | `finos/FDC3` → `toolbox/fdc3-conformance`, built from source, FDC3 3.0.0-alpha.5 workspace snapshot |
| Runner dist pinned here | `runner/dist/` — `dist` tar md5 `443d8b17883e139d28acd72785748141`; the exact bytes used for the recorded runs |
| Desktop Agent under test | estate agent served at `traderx.synapticchain.xyz` (v6/v11-frozen, md5s in [RECEIPTS.md](RECEIPTS.md)) |
| App Directory v2 | `terminal.synapticchain.xyz/api/fdc3/appd/v2/apps?include=conformance` — 18 FINOS conformance records served **verbatim** (md5-checked equal against FINOS `static/directories/localhost-conformance.json`) + 2 estate records |
| Harness example | `harness-example-conf-angular.js` — the persisted Playwright runner copy pointed at the Angular conformance host |
| Full receipts | [RECEIPTS.md](RECEIPTS.md) — bytes tables, md5s, run-log hashes, results both runs |

## What the 132 tests are

The runner's **"All" pack = basicSuite + advancedSuite**, Cucumber-authored specs
from FINOS:

- **Basic** — Desktop Agent fundamentals: `broadcast` / context listener delivery,
  `getCurrentContext` with and without metadata, user-channel join/leave, listener
  lifecycle.
- **Advanced** — the API surface DAs usually fail: `findIntent` /
  `findIntentsByContext` resolution rules, `raiseIntent` (success, result-return,
  and `NoAppsFound` error paths), `getAppMetadata`, app channels and private
  channels, `contextMetadata` / `intentContextMetadata` provenance (agent MUST
  deliver `source`/`timestamp`, must merge app-supplied `traceId`),
  `intentListenerConflict` (`ResolveError.IntentListenerConflict` semantics),
  `ResolveAmbiguousIntentTarget` (+ MultiInstance), `ChannelChangedEvent`.

Truth source for a run's score: the **DOM** (`.test.fail h2` list), never the
mocha stats bar — mocha retry events overcount failures.

## The x2 discipline (why "twice on identical bytes" means something)

Any change to deployed bytes invalidates every previous score. The estate's rule:
bump the cache-buster (`?v=N`), verify **served md5 == disk md5**, then run the
suite twice sequentially (mocha stats frozen across two polls 12 s apart) before
any claim. The receipts record the exact bytes and md5s for both runs — the score
is a property of *those bytes*, not a standing property of the agent.

## Re-running it yourself

**Self-service click-path:** serve `runner/dist/` statically (`npx http-server
runner/dist -p 3001 -c-1 --cors` or any static host), open it in a browser, select
the **All** pack, and run it against a Desktop Agent endpoint. Verified so far via
the estate harness (Playwright-driven, `harness-example-conf-angular.js`); the
click-run path by a third party is the same page, same buttons — and is tagged in
RUNBOOK as the one step pending an independent third-party verification.

**Estate harness reproduction:** see [RUNBOOK.md](RUNBOOK.md) — launcher/directory
URL protocol, pack selection, completion criterion, DOM-truth rule, and the freeze
rules around the demo bytes.

## Honest limits

- Rails and surfaces are publicly verifiable; the suite run itself needs a browser
  (it is a browser-resident Desktop Agent being graded).
- The suite is pinned to the alpha.5 snapshot; FINOS's tool moves, upstream churn
  can change scores — that is *deliberate* exposure on our part: a pinned, honest
  instrument beats a flattering, moving one.
- One operator estate; standing-maker and operator-run constraints are disclosed in
  the companion submission dossier, not hidden here.

## License & attribution

- `runner/` is **FINOS's fdc3-conformance**, Apache-2.0, unmodified — see
  [NOTICE](NOTICE). The upstream project: https://github.com/finos/FDC3
- Receipts, runbook, and this README are SynapticChain estate documentation.