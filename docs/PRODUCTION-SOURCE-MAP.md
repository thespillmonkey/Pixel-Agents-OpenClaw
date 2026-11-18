# Production source map and integration checklist

> **Later source-sync update:** the documentation-only status described below is
> the earlier publication checkpoint. The subsequent source sync includes the
> production runtime minus private bridge changes. See
> [SOURCE-SYNC-2026-11-18.md](SOURCE-SYNC-2026-11-18.md) for current distribution
> scope, portability adjustments and validation. Historical receipts below remain
> historical evidence, not tests of the new public build.

This is a map of the inspected production delta relative to the November 11
public source commit `a4dd21fecba2d01837bdee6973fe2d9683756a5a`. Paths below refer
to the retained **production source**, not promises that these modules already
exist on this public branch. This publication changes Markdown only.

## Consolidated note coverage

The production write-up replaces scattered, sometimes superseded revision notes
with current behavior. Historical offsets and candidate-only gates are not live
installation instructions.

- `ASSET-PACKS.md`: consolidated registrations and preserved manifest metadata.
- `docs/office-layering.md`: wall/finish pass separation, support and collision rules.
- `JUNGLE-ROOM-RUNTIME.md`: identity-owned jungle workstations, clock and hallway separation.
- `FOGGY-CHAIR-ALIGNMENT.md`: separate seated art and chair-back depth.
- `TAKEMI-CLINIC.md` and `TAKEMI-IDLE.md`: clinic layout, whole-solid fixtures,
  corrected work/read/idle mapping, coat, armrest, crossed legs and skirt.
- `NSI-RACK-LIGHTS.md`: staggered, monotonic-clock ambient LED overlays.
- `BREAK-ROOM.md`, `BREAK-ROOM-SCALE.md`, `BREAK-ROOM-FOOSBALL.md` and
  `BREAK-ROOM-ALIGN.md`: native furniture, support geometry, agent scale,
  north-wall join, wider kitchen, foosball, dining occlusion and final offsets.
- `OFFICE-HALLWAY.md`: squared corridor with adjacent-room finishes.
- `IDLE-PLAY.md` and `NEXT-GITHUB-UPDATE.md`: current full-toy revision supersedes
  the initial three-toy/lean experiment; public design is in
  [IDLE-PLAY-DESIGN.md](IDLE-PLAY-DESIGN.md).
- Additional source/test differences capture compact-office seating, room width
  revisions, stable primary seats, buffered restore, status bubble cleanup,
  fractional zoom rasterization, native character overrides and portraits.

## Module responsibilities

- Assets: `core/src/assets/{types,manifestUtils}.ts`, `server/src/assetLoader.ts`
  carry validated visual offsets and floor-layer metadata through catalog loading.
- Persistence: `primaryWorkSeat.ts`, `configPersistence.ts`, `agentMessages.ts`,
  `clientMessageHandler.ts` preserve exact-name workstation ownership across restore.
- Scene: `layoutSerializer.ts`, `furnitureCatalog.ts`, `wallTiles.ts`, `renderer.ts`
  coordinate render passes, solid footprints, supported props and custom split rows.
- Raster/alignment: `spriteCache.ts`, `matrixEffect.ts`, `characterAlignment.ts`
  preserve pixel edges and distinguish visual offsets from grid/depth state.
- Identity art: `libraryRuntime.ts`, `jungleRuntime.ts`, `serviceRuntime.ts`,
  `nsiRuntime.ts`, `clinicRuntime.ts` and their data implement authored-room rules.
- Leisure: `idlePlay.ts` owns scheduling/reservations; `playMotion.ts` plus
  `playData.json` select standing actions; `toyAnimations.ts` changes active props.
  `characters.ts`, `officeState.ts`, `types.ts` and alignment/picking connect it.
- UI/transport: settings disclosure, character cards/portraits, tool labels and
  status handling remain separate from actual provider execution.
- Tests: room geometry, layering, identity/seat restore, activity mapping, 30-second
  rests, rack cadence and idle-play interruption have dedicated regression files.

## Publication boundaries for a future source sync

1. Retain the already-published fork history, licenses and external-publishing
   workflow guards. A production working snapshot is not a replacement Git history.
2. Preserve public one-to-one agent mapping. `server/src/productionMirror.ts` and
   its projection-status wiring are site-specific and must not be copied into the
   public bridge. No extra worker/job semantics should be inferred from NPCs.
3. Reconcile generic work-seat and rendering changes independently of that private
   mirror. Do not discard useful seat persistence simply because it shares a file.
4. Review embedded character data and external pack redistribution separately;
   do not copy live layouts, registrations, credentials or complete runtime state.
5. Keep older supported external sheet formats and actual selected-sheet playback
   tests. Identity-bound room/play overrides are not generic catalog compatibility.
6. Freeze and qualify the resulting public source/artifact itself. Production
   browser receipts are not proof of an edited public build, and the documented
   three broader test failures must remain visible until resolved and rerun.
7. Do not overwrite the newer office with an older same-version public archive.
   Preserve a state-consistent rollback and reconcile any newer production deltas.

## Inspected path inventory

This inventory makes the extent of the difference explicit; it is not an
installable patch or a claim that every production-only path should be published.
The production snapshot also retains older operational/candidate notes; the
consolidated public prose above is authoritative for this documentation update.

### Changed existing production paths

- `.github/workflows/publish-extension.yml`
- `CHANGELOG.md`
- `core/src/assets/manifestUtils.ts`
- `core/src/assets/types.ts`
- `server/src/agentActivityResend.ts`
- `server/src/agentMessages.ts`
- `server/src/assetLoader.ts`
- `server/src/clientMessageHandler.ts`
- `server/src/configPersistence.ts`
- `server/src/httpServer.ts`
- `server/src/types.ts`
- `webview-ui/src/components/AgentCard.tsx`
- `webview-ui/src/components/CharacterMugShot.tsx`
- `webview-ui/src/components/SettingsModal.tsx`
- `webview-ui/src/constants.ts`
- `webview-ui/src/hooks/useExtensionMessages.ts`
- `webview-ui/src/hooks/useTerminalDrawer.ts`
- `webview-ui/src/office/characterAlignment.ts`
- `webview-ui/src/office/components/ToolOverlay.tsx`
- `webview-ui/src/office/engine/characters.ts`
- `webview-ui/src/office/engine/existingAgents.ts`
- `webview-ui/src/office/engine/matrixEffect.ts`
- `webview-ui/src/office/engine/officeState.ts`
- `webview-ui/src/office/engine/renderer.ts`
- `webview-ui/src/office/layout/furnitureCatalog.ts`
- `webview-ui/src/office/layout/layoutSerializer.ts`
- `webview-ui/src/office/sprites/spriteCache.ts`
- `webview-ui/src/office/types.ts`
- `webview-ui/src/office/wallTiles.ts`
- `webview-ui/src/testHooks.ts`
- `webview-ui/test/extendedForkFormats.test.ts`

### Additional production paths

- `ASSET-PACKS.md`
- `BREAK-ROOM-ALIGN.md`
- `BREAK-ROOM-FOOSBALL.md`
- `BREAK-ROOM-SCALE.md`
- `BREAK-ROOM.md`
- `FOGGY-CHAIR-ALIGNMENT.md`
- `IDLE-PLAY.md`
- `JUNGLE-ROOM-RUNTIME.md`
- `NEXT-GITHUB-UPDATE.md`
- `NSI-RACK-LIGHTS.md`
- `OFFICE-HALLWAY.md`
- `TAKEMI-CLINIC.md`
- `TAKEMI-IDLE.md`
- `docs/office-layering.md`
- `server/__tests__/primaryWorkSeat.test.ts`
- `server/src/primaryWorkSeat.ts`
- `server/src/productionMirror.ts`
- `webview-ui/src/office/breakRoomData.json`
- `webview-ui/src/office/breakRoomRuntime.ts`
- `webview-ui/src/office/clinicData.json`
- `webview-ui/src/office/clinicRuntime.ts`
- `webview-ui/src/office/engine/idlePlay.ts`
- `webview-ui/src/office/engine/playMotion.ts`
- `webview-ui/src/office/engine/toyAnimations.ts`
- `webview-ui/src/office/hallwayRuntime.ts`
- `webview-ui/src/office/jungleData.json`
- `webview-ui/src/office/jungleRuntime.ts`
- `webview-ui/src/office/libraryRuntime.ts`
- `webview-ui/src/office/nsiData.json`
- `webview-ui/src/office/nsiRuntime.ts`
- `webview-ui/src/office/playData.json`
- `webview-ui/src/office/serviceData.json`
- `webview-ui/src/office/serviceRuntime.ts`
- `webview-ui/test/assetPackConsolidation.test.ts`
- `webview-ui/test/breakRoomProduction.test.ts`
- `webview-ui/test/bufferedSeatRestore.test.ts`
- `webview-ui/test/clinicProduction.test.ts`
- `webview-ui/test/digbyMitsukiRevision.test.ts`
- `webview-ui/test/environmentLayering.test.ts`
- `webview-ui/test/furnitureLayering.test.ts`
- `webview-ui/test/idlePlay.test.ts`
- `webview-ui/test/idleRest30.test.ts`
- `webview-ui/test/jungleRoom.test.ts`
- `webview-ui/test/libraryRoom.test.ts`
- `webview-ui/test/nsiAlignmentRevision.test.ts`
- `webview-ui/test/nsiFurniture.test.ts`
- `webview-ui/test/nsiRackLights.test.ts`
- `webview-ui/test/nsiRuntime.test.ts`
- `webview-ui/test/officeHallway.test.ts`
- `webview-ui/test/roomCompactRevision.test.ts`
- `webview-ui/test/roomWidthsRevision.test.ts`
- `webview-ui/test/serviceRoom.test.ts`
- `webview-ui/test/serviceRoomIntegration.test.ts`
- `webview-ui/test/takemiNeedleIdle.test.ts`

### Public paths absent from the production source snapshot

- `docs/RELEASE-2026-11-11.md`
