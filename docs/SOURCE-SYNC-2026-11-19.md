# Production successor source sync — November 19, 2026

This source-only update follows `747dcad` and reconciles the newer production
TV, table-loop, interaction-anchor and browser-performance changes. It updates the
maintained local checkout and both public fork branches. It does not restart or
redeploy production, replace earlier release downloads, or publish to npm/Marketplace.

## Rendering performance

Furniture rebuilds and native wall transforms previously produced fresh SpriteData
arrays even when their pixels were unchanged, defeating the identity-keyed raster
cache. Weak source-keyed row-slice/height caches preserve stable raster identities
while allowing replaced catalog sources to retire. Depth keys, anchors, collision,
mirroring and artwork remain unchanged.

Opaque `#RRGGBB` palettes now batch into one ImageData upload. Cell edges retain the
same floor-aligned boundaries at fractional zoom. Arbitrary CSS and alpha-bearing
colors retain the original Canvas parser/compositor path. New tests cover exact
quarter-step coverage, transparent cells, source replacement and cache reuse.

Retained production evidence compared 4,025 sprite/scale combinations and
37,129,770 pixels against the previous browser Canvas path with zero differences;
169 fallback cases retain that original path. A matched 14-agent headless test
measured first zoom-out at 3.43 s before versus 0.59 s after. These are test-host
samples, not a universal FPS guarantee. This publication's fresh public-build
checks are reported separately below.

## Newer production behavior retained

- Air hockey and foosball: 600 slots at 40 ms, preserving 24-second / 25-fps loops,
  opposite-side reservations, both-arrivals activation and paired cancellation.
- TV: two couch seats, static seated viewer, randomized 3–6 second RGB light spill,
  original rear-panel pixels unchanged, timeout/layout/disappearance cleanup and
  immediate work interruption followed by home-workstation return.
- Current interaction visual anchors, including darts 45 pixels south of the
  board bottom, independent from the conservative navigation grid.

## Public/private boundary

The public bridge remains metadata-only, one actual agent to one NPC. The private
production mirror module, hook interception, projection-status type and projected
reconnect replay are not imported. Existing relay/provider files and publishing
workflow guards remain unchanged. The six embedded runtime data JSON files retain
exact bytes from the previous source sync. External furniture packs, complete
production office layout, credentials, saved preferences and raw activity are not
included; a new checkout still needs separately installed matching assets/placements.

Runtime imports receive only repository formatting, import sorting and scoped
native-palette lint annotations. Normalized body/import checks verify equivalence
with the deployed source. TV tests use generated stand-in pixels and a synthetic
map; no private production snapshots are published. The previously documented
12 staging-only acceptance suites remain intentionally outside public unit tests.

## Fresh public-build validation

The fresh aggregate run passed **1,638 tests** with zero skips: 526 webview,
1,099 server, seven package-contract and six relay checks. `npm run package`
passed protocol generation, server types, lint, CLI/extension bundling and webview
TypeScript/Vite builds. The existing React-hook dependency and large-chunk
warnings remain; neither is a new failure.

All ten imported runtime modules match production after normalization of the
stated mechanical edits; six embedded data JSON files remain byte-identical.
The 791-code-file manifest and 97-file frontend were frozen for browser QA.
The built public frontend passed browser-local scene checks against read-only
current production assets: 97,280 room pixels and 29,184 corridor pixels match
exactly, all 699 resolved catalog entries are preserved, TV viewing stays static,
the light changes hue, and work interrupts immediately with return to the same
workstation. Desktop and narrow screenshots were inspected, with no overflow or
browser errors. Synthetic activity stayed in the browser and outbound seat writes
were blocked; production state hashes matched after browser closure.

This is not a new provider-inference, full VS Code or GitHub CI acceptance claim.
Production runtime and existing downloadable release artifacts are unchanged by
this source publication.

See [base source boundaries](SOURCE-SYNC-2026-11-18.md),
[play contracts](IDLE-PLAY-DESIGN.md), and
[earlier differential notes](PRODUCTION-DELTA-2026-11-18.md).
