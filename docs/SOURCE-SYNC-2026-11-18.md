# Production source sync — November 18, 2026

This update follows the earlier documentation-only commit `5e76af0` and imports
current production implementation into the maintained public fork. It preserves
the existing Git history and upstream v1.6 integration. The running installation
is not changed or restarted by this publication.

## Included implementation

- Authored library/office, jungle, mail/farm/security, NSI, clinic, break-room and
  hallway runtime behavior; identity-bound character animation data and rules.
- Render-only catalog offsets/floor layers, supported-prop depth, whole-solid
  fixture handling, split-row dining layering and bounded authored-wall suppression.
- Seated visual anchors separate from navigation and chair depth; quarter-zoom
  pixel-edge rasterization; portraits and activity-label positioning.
- Stable exact-name primary work seats across new feed identities and stale saves;
  buffered snapshot seat restoration and correct inactive/unknown bubble cleanup.
- Consolidated asset-pack settings disclosure and standard 30-second seated rests.
- Full idle-play scheduler/reservations, seven single-player toys, two paired
  tables, immediate work preemption, seven custom standing-play sets and native
  toy overlays. See [the play contract](IDLE-PLAY-DESIGN.md).

Runtime code and embedded animation/rule data are imported from the frozen
production source without redesigning the scene. Public-only adjustments are
formatting/import sorting, a documented native-palette lint exception, removal
of an unused `toyContext` parameter, portable tests/documentation and the bridge
exclusions below. The included six data JSON files remain byte-identical;
normalized runtime-body checks confirm equivalence after those mechanical edits.

## Public bridge exclusions

The OpenClaw relay and provider remain metadata-only and **one actual agent to one
named NPC**. No private Code Monkey display mirroring is published.

- `server/src/productionMirror.ts` is absent.
- `server/src/httpServer.ts` retains its published direct hook dispatch, without a
  mirror import, mirror lifecycle or mirror interception.
- `server/src/types.ts` retains the public agent type, without `projectionStatus`.
- `server/src/agentActivityResend.ts` retains actual-agent status replay, without
  private projected-status priority.
- Existing relay/provider integration sources remain unchanged. Public primary
  work-seat persistence and ordinary status display are separate features and
  remain included.

The existing fork-only guards against accidental npm/Marketplace publishing are
retained even though the production working snapshot lacks those publication-only
changes. No registry, extension marketplace or binary release is created here.

## Artwork and layout prerequisites

The source includes embedded identity animation/rule data used by the deployed
room runtimes. It does not include the private external furniture directories,
complete installed office layout, appearance configuration, asset registrations,
connection settings, credentials or raw activity logs. Existing bundled stock
assets and the default layout are unchanged.

Thus a fresh build supplies the runtime functionality but does **not** reproduce
the full production office automatically. Authored room behaviors require their
matching placed catalog entries and station/seat IDs. Toy discovery currently
recognizes the explicit `break28-*` types in `TOY_TYPES`; it is not an editor UI for
registering arbitrary toys. With no matching toys, normal idle movement continues.

The older 112×96, 128×96 and fork extended-sheet decoder behavior is retained.
Room and standing-play overrides do not establish a new standard PixelIndex import
format. Existing upstream attribution/license and third-party design rights remain;
this source sync does not grant additional rights to external reference images.

## Test portability

Historical one-off scene acceptance files read non-repository staging layouts,
pack snapshots or predecessor art releases. They are not shipped as runnable public
unit tests, and private fixture files are not copied merely to satisfy their paths.
Their retained production evidence remains described in the differential notes.

The 12 staging-only suites omitted from the public import are:

- `assetPackConsolidation.test.ts`
- `breakRoomProduction.test.ts`
- `clinicProduction.test.ts`
- `digbyMitsukiRevision.test.ts`
- `jungleRoom.test.ts`
- `libraryRoom.test.ts`
- `nsiAlignmentRevision.test.ts`
- `nsiFurniture.test.ts`
- `officeHallway.test.ts`
- `roomCompactRevision.test.ts`
- `roomWidthsRevision.test.ts`
- `serviceRoomIntegration.test.ts`

The public idle-play suite uses deterministic geometric furniture stand-ins and
an isolated synthetic map, not the private production snapshot. Rack-light tests
use opaque generated pixel canvases. Takemi tests inspect the included current
animation data without requiring an old private art revision. Two obsolete
hardcoded position assertions are aligned with the current included station data.
These changes do not modify deployed runtime behavior or claim fresh production
scene acceptance.

## Validation

The final public-source aggregate run passed **1,627 tests**: 515 webview,
1,099 server, seven package-contract and six relay checks. Unlike the initial
pre-build server run (1,076 passed / 23 skipped), the final run exercised all
1,099 server tests after the build was available. No skips or failing assertions
were reported in the final aggregate run.

`npm run package` passed protocol generation, server types, lint, extension/CLI
bundling and webview type/build checks. The existing React-hook dependency warning
and large frontend-chunk warning remain. AsyncAPI validation passed. The generated
E2E inventory was refreshed to 155 tests; that inventory is not a claim that all
155 browser scenarios were executed. Six embedded data JSON files match production
exactly; normalized checks cover 36 runtime modules, with the stated mechanical
adjustments and bridge exclusions.

The initial direct import exposed ten missing private-fixture suites plus the
three historical position assertions described in the earlier production notes.
That unqualified run was not accepted. The final public suite is portable: the
staging-only acceptance files are excluded explicitly above, core behavior uses
self-contained fixtures, and current positions are checked against included station
data. Public green results do not erase the retained historical production failures.

A separate browser-local check of the built public frontend uses the current
production scene/assets read-only; its fixtures are not part of the publication.
It passed full-room and corridor pixel preservation, toy approach/play interruption,
workstation return, paired arrival/cancellation, fixed Rebooto and narrow-screen
visibility. Synthetic activity is injected only into the browser subscriber and
outbound seat writes are blocked. The room comparison checked 97,280 pixels and
the corridor seam 29,184, both with zero mismatches. All 699 resolved catalog
entries were preserved; the 97-file frontend was frozen before this check.
Desktop, paired-play and narrow-screen screenshots were inspected, and protected
runtime-file hashes matched after browser closure. This does not claim a fresh provider inference,
a full VS Code acceptance run or new GitHub CI success.

## Installation and rollback

Build with the existing repository commands and preserve current external asset
registrations, saved appearances and primary work-seat preferences. Do not replace
a live configuration with an old full snapshot. Back up the installation and
runtime state before upgrading, and retain the old build for rollback. This update
publishes source only; it does not redeploy the current installation or replace
the November 11 downloadable archives.
