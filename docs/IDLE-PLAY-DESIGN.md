# Idle play — deployed design and animation contract

> **Later source-sync update:** the documentation-only status described below is
> the earlier publication checkpoint. The subsequent source sync includes the
> production runtime minus private bridge changes. See
> [SOURCE-SYNC-2026-11-18.md](SOURCE-SYNC-2026-11-18.md) for current distribution
> scope, portability adjustments and validation. Historical receipts below remain
> historical evidence, not tests of the new public build.

Status: production design as of November 19, 2026. This document describes the
later deployed implementation; it does not add that implementation to this public
source snapshot. See [publication scope and validation](PRODUCTION-DELTA-2026-11-18.md).

## Eligibility and scheduling

Each eligible idle character gets an independent **30% trial every 60 simulation
seconds** (`random < 0.30`). Active work resets the countdown. At most one trial
runs per update; a long pause does not cause a catch-up burst. A failed trial
leaves normal wandering and the 30-second seated rests unchanged.

Fixed Rebooto, helpers/team followers, matrix effects, permission/awaiting-input
states and unknown activity are excluded. Play never changes actual provider
activity, saved workstation assignment or server tool metadata.

## Selection and exclusive ownership

Select uniformly among **all free, reachable toy units on the map**. Distance is
not a weight. Reachability and occupied/reserved approach cells still exclude
invalid targets. Two pinball cabinets are separate units; a multiplayer table is
one unit with two opposite slots.

Reserve an approach during travel as well as use. Other routes avoid reserved
approach cells. Missing targets, removed actors, blocked paths, layout changes and
a 120-second travel/wait timeout release reservations. No toy is animated merely
because an agent is walking toward it.

Single-player units: both pinballs, arcade, dartboard, claw machine, sink and coffee
maker. Derive navigation/visual anchors from the actual placed device so moving a
cabinet does not leave an invisible stale play station behind.

## Lifecycle and immediate work priority

`idle → reserve → approach → PLAY → release → ordinary idle`

Solo use lasts 20–40 seconds after arrival. `PLAY` is a frontend movement/visual
state, not a fake working status or provider event.

Both active status and tool-start activation take the existing workstation path:

1. Immediately release the toy reservation and turn off its active override.
2. Clear interaction-only visual offsets and cancel the remaining toy route.
3. Calculate the route back to the same saved workstation.
4. If interrupted partway across a tile edge, finish only that partial edge before
   the home route, avoiding a teleport.
5. Start normal workstation visuals only after arrival. An unreachable/missing
   workstation does not make the agent work in place at a toy.

## Multiplayer

When a changed cohort reaches **four or more PLAY participants**, make one 50%
trial for that cohort, not a repeated per-frame roll. On success choose two solo
players without replacement, then uniformly choose a free multiplayer unit
reachable by both. With air hockey and foosball both available, each has 50% odds;
occupied or unreachable units are excluded before selection.

Reserve both opposite-side approaches together. Both participants must arrive
before the table starts; use a 24–40-second paired duration. Work by either player,
disappearance, invalid path or timeout releases **both** reservations and stops
the table immediately. An idle partner resumes ordinary idle behavior. This is
client-local office simulation, not multiplayer networking between browsers.

## Standing character art

The approved standing/typing-like arm action has four facings and eight 150 ms
slots per direction on a 24×32 native canvas, feet anchor `(12,32)`. Heads, feet,
clothing silhouette, backpack fill and straps remain fixed; moving wrists/sleeves
are separate from those protected features. Timed slots and distinct visible poses
are different measurements.

Custom sequences are integrated for Mitsuki plus Codelia, Javathan, Gitbert,
Bashley, Bugatha and Vectoria. Other mobile identities retain the previous visual
fallback; Rebooto remains excluded. This is an identity-bound runtime override,
not a replacement of legacy work, reading, walking or rest sheets and not a new
standard PixelIndex import schema.

## Toy visuals and interaction anchors

Single-player animated overlays use **64 slots × 100 ms**, a 6.4-second loop.
Air hockey and foosball use **600 slots × 40 ms**, a 24-second loop at 25 fps.
Playback begins only during use (both players must arrive for paired tables):

- Pinballs: changing playfields, preserving cabinet bodies and support pixels.
- Arcade: animated display, fixed cabinet.
- Dartboard: thrown projectile; agent faces the board with visual feet 45 native
  pixels south of its bottom edge.
- Claw: animated mechanism within the glass, side-control interaction facing right.
- Sink: water-only animation on the existing counter.
- Coffee maker: local brewing effect.
- Air hockey: two opposite players, animated play surface.
- Foosball: two rod-side players, animated rods/players/ball.

Navigation stays on conservative reachable grid cells. Separate device-centered
visual feet bring the character close enough to use the controls without altering
collision footprints. Rendering, hit testing and labels share this offset and
clear it on cancellation. Off-state uses the original sprite. These overlays do
not resize cabinets, change collision rules or mutate the asset files.

## Verification requirements

Test chance boundaries/cadence, uniform selection without distance weighting,
exclusions, contention, arrival gating, duration, interrupted travel and use,
paired cleanup, workstation return and reservation release. Test actual transport
handlers as well as engine calls. Compare isolated furniture pixels over time so
character motion cannot supply a false animation pass. Keep synthetic events
browser-local and block unintended persistence during read-only production checks.

## TV viewing

The `break28-tv` toy resolves eligible `break28-seat-south` viewer positions inside
its nearest `break28-sofa`. It is offered once during random toy selection; a free
couch seat is selected and reserved without replacing the agent's saved workstation.
Viewers use a static south-facing seated pose, not standing-play arm motion. The
TV rear-panel sprite remains unchanged. A soft oblique light quadrilateral fades
from at most 13% opacity to transparent over 48 native pixels; blue, red and green
hues change at randomized 3–6 second intervals. Work activation immediately clears
the viewer pose, reservation and light, then routes the agent to its own workstation.
Current sink, coffee and dart anchors are authored visual offsets separate from
navigation; see runtime source rather than older historical screenshots.
