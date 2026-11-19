# Production differential notes — November 18, 2026

> **Later source-sync update:** the documentation-only status described below is
> the earlier publication checkpoint. The subsequent source sync includes the
> production runtime minus private bridge changes. See
> [SOURCE-SYNC-2026-11-19.md](SOURCE-SYNC-2026-11-19.md) for current distribution
> scope, portability adjustments and validation. Historical receipts below remain
> historical evidence, not tests of the new public build.

## What this update publishes

This is a consolidated **documentation update**, covering the production work since
our [November 11 integration](RELEASE-2026-11-11.md). It records the current design,
compatibility boundaries, implementation map and verification results. It does
**not** replace the public runtime source, upload the private office asset packs,
or create a new installable release. Cloning this documentation commit still
builds the previously published runtime, not the later production scene described
below. Production and public distribution must not be conflated.

The source baseline for comparison is commit
`a4dd21fecba2d01837bdee6973fe2d9683756a5a`, integrating upstream v1.6.0. The later
production source and its sealed frontend were inspected when preparing these
notes. The running service was also checked read-only and still selected the
standing-play/toy revision. No production restart was required for this write-up.

The public OpenClaw bridge remains metadata-only and **one actual agent to one
named NPC**. Site-specific display mirroring is not a public bridge feature and
is not shipped by this update. Neither office play nor animated props represent
real provider work, jobs, extra agents, or an OpenCode integration.

## Summary of the production differences

- Authored rooms now cover the archive/library, Mitsuki's office, NSI helpdesk and
  mini datacenter, Takemi clinic, Code Monkey jungle studio, mail/farm/security
  office, and a kitchenette/recreation room connected by a squared corridor.
- Character identity, work location, visual alignment, sprite selection and
  furniture animation are coordinated without repurposing saved appearance IDs.
- Furniture uses explicit floor/background/depth layers and independently tested
  navigation footprints. Fully solid fixtures have no walk-through upper half.
- Seated rests last 30 seconds. Eligible idle agents can independently seek toys;
  work immediately cancels leisure and routes the character to its workstation.
- Standing-play art and longer toy animations include paired air-hockey and
  foosball sessions, with exclusive reservations and arrival gating.

## Rendering, collision and persistence

### Furniture and authored surfaces

The standard production rule is a solid lower footprint, with the upper visual
portion depth-sorted against characters and the lower visual portion behind them.
Walls, shelves, fixtures and wall finishes have their own background handling.
This is a default, not a reason to make every object half passable: the clinic's
whole examination bed and both upper cabinets are explicitly fully solid.
Every intersected blocked grid cell must be checked, not only the sprite center.

Tables retain supported objects as complete assemblies. Tabletop props sort just
after their supporting top; they must not be split apart by the generic halfway
cut. Dining furniture has an explicit split row so the near edge of the tabletop
occludes the side-chair seats correctly, while legs remain in the background.
Chair-back depth is distinct from a character's drawn sitting offset.

Validated render-only manifest properties include integer `drawOffsetX` and
`drawOffsetY` (bounded to ±256), plus `renderLayer: "floor"`. Placement, support
alignment, collision geometry and visual depth must be reconciled separately;
a pretty sprite does not establish a traversable layout.

Authored room finishes suppress overlapping stock wall art only within their
measured bounds. Decorative finishes must remain visible between fixtures, and
each render instance draws once. Outside those bounds native wall behavior is
preserved. Compact-office seated alignment also corrects a half-tile horizontal visual mismatch
without moving the navigation cell or standing-casting characters. Quarter-step
zoom sprite caching now uses shared integer pixel edges
to prevent fractional-coverage crosshatch seams.

### Stable work locations and identity

An optional exact-name `primaryWorkSeats` mapping preserves work locations across
new feed IDs and reconnecting browsers. A stale browser seat save cannot erase a
named primary work seat. Helpers/subagents do not inherit the owner's station.
Buffered agent restoration reapplies the saved seat after the real layout loads,
without stealing an already assigned seat.

Character runtime modules choose explicit identities from actual metadata, not
just a short-name test fixture. Full-name and late team-metadata arrival need
coverage. Visual feet, navigation cells, pointer bounds, labels and depth keys
are separate concerns; moving one must not silently move the others.

Status handling clears completion bubbles on idle/unknown updates, avoiding a
stale green completion check over Rebooto's screen. Unknown activity is not idle
permission to seek a toy. Asset-pack UI is consolidated rather than accumulating
permanent patch registrations; rotation, on/off and animation metadata survive
consolidation. Existing hash-based character identities and order are preserved.

## Room and character revisions

### Archive and Mitsuki's office

The archive uses identity-owned casting/work space, room-specific fixtures and
seat alignment. Library bookcases remain **solid but behind characters**; tables
retain their foreground/solid behavior. Wall masonry and finishes are continuous
rather than isolated repeating caps.

Mitsuki's room was moved against the archive, extended upward behind the desk,
and later widened. Her desk, its supported contents and chair were moved upward
together. NSI was moved against Mitsuki's room and extended to the same top-row
height. Southern boundaries were aligned across the three rooms. Room resizing
required rechecking routes and work anchors, not merely stretching a screenshot.

### Code Monkey jungle studio

The six named workstations have exclusive approach cells. Only the owning active
character, actually at its station, activates its work props. Walking, waiting,
missing seats and helpers cannot turn a station on. Working and reading share
24 timed slots at 150 ms, synchronized with the workstation props. The authored
work canvases can be larger than the native locomotion sprites; picking bounds
and portraits use the same identity rules.

The room was moved south to separate its wall from the corridor, then narrowed
by roughly 30%, retaining its left edge. Later width revisions preserved the
entrance and reflowed supported items. These are authored-layout changes, not a
new generic arbitrary-size character-sheet format.

### Mail, farm and security office

The room height was brought into line with its neighbor. Subsequent width
reductions, including an approximately 15% compression, retained comfortable
circulation. Floor tone and the continuous entrance strip were matched, and the
doorway light was removed. Plants and surface accessories were repositioned on
their supports after resizing. The right garden bed uses matching soil and two
even rows of vegetables.

- **Patches:** 40-slot, 50 ms hoeing loop from the space between the garden beds,
  aimed at the left bed. Character and separate hoe layers remain aligned through
  the closer/higher work-anchor corrections.
- **Pepe:** 80-slot, 50 ms work/read loop gesturing between pinned mail, the
  A-frame chart and the mail pile like an enthusiastic conspiracy explanation.
- **Foggy:** the approved working action is sleeping in his chair with animated
  cartoon Zs, replacing typing. His separate reading action is retained. Camera
  feeds change scene every 10 seconds. Seated art was raised 6 native pixels and
  its depth placed behind the chair back; ordinary walking keeps normal depth.
  Desk, rug and supported objects remain separate from this seated correction.

The trio room was shifted left after narrowing the jungle room to remove the gap.
Absolute coordinates in early revision notes are historical, not current anchors.

### NSI helpdesk and mini datacenter

Rebooto's character layer is only the expressive face monitor. The rest of the PC
and its equipment table are static furniture, with a readable nameplate rather
than a human workstation. The monitor stays in its socket for work, reading,
waiting and idle; Rebooto cannot wander and is excluded from standard play.
The rug under the table was squared off.

Rooty and Digby use their reference-based mobile characters in the rear datacenter.
Rooty's head/collar connection was corrected. Digby's working action cracks a whip
at the computer; successive work-anchor shifts brought him closer. His laptop
rests on a sandstone temple-style pedestal rather than the original table.

The room received a revised office floor, expanded height/width, thicker southern
wall coverage and spread-out ceiling fixtures. Rack LEDs use tiny cached pixel
variants: 17 indicators across six racks, touching only 25 existing opaque pixels.
Eight phases at 1.5 seconds give a 12-second loop, with staggered 6-second bright
and dim periods. Ambient timing uses a monotonic clock so simulation clamping
does not slow the effect; original rack art and collision metadata stay intact.

### Takemi Medical Clinic

A narrow top-row clinic sits beside NSI, at the same height as the other upper
rooms and roughly half Mitsuki's room width. The game-office reference informed
the blue-purple palette, medicine storage, privacy screen, bed and doctor's chair.

The X-ray panel became the backboard of a wall-aligned paperwork desk. A separate
smaller computer desk sits farther south, also flush to the wall. Supported papers
and computer components move with their parent. Cabinet revisions reduced the
right cabinet by 30% and left by 20%, placed their bases on the floor in their
corners, and restored a right-angle floor corner. Later small desk nudges preserve
the approved assembly rather than regenerating unrelated artwork.

Takemi's raised-hand syringe preparation is **working**, not idle. Reading keeps
the clipboard sequence; inactive Takemi wanders/rests normally. Her seated pose
has a clear knee-over-knee leg silhouette, an open white doctor's coat, her free
hand resting on the chair arm and a one-pixel longer skirt hem. Work uses 24 slots
at 150 ms, reading 16 at 150 ms, and the seated rest eight held slots. The 24×44
seated canvas uses anchor `(12,40)`; extra canvas legroom is not a navigation or
depth-sort change. Full identity aliases include Doctor Tae Takemi.

### Break room, games and hallway

The lower-right room completes the building rectangle. One side has refrigerator,
sink/counter, microwave, coffee maker and dining table with four chairs and basic
table supplies. The lounge uses a neutral office sofa and a centered rug/TV/low
stand arrangement; decorative clutter was removed and the TV enlarged by about
30%. The other side contains two pinballs, an arcade cabinet, dartboard, side-view
claw machine, air-hockey table and vertical foosball table.

Oversized kitchen/game/sofa components were re-exported at about 60% native size
against agent proportions. The kitchenette was widened and moved up to the wall,
then adjusted another 8 pixels up and 3 right. Pinball machines and arcade were
moved north to the wall. Darts moved another 6 pixels up. The dining assembly moved
8 pixels left with corrected tabletop/chair occlusion. Foosball was aligned with
the claw-machine center, preserving a 20-pixel rug-side walking strip on its left.
The claw machine is against the right wall with full-depth side glazing.

The north wall/door band moved upward to eliminate the corridor gap, without
stretching the rest of the room. The rectangular office corridor has clean walls,
sterile office flooring and southern/endcap finishes matched to the adjacent
southern rooms. The floor artwork is nonblocking; the authoritative tile grid
controls walls and door openings. Existing room entrances and work routes remain.

## Idle interaction system

The detailed [idle-play specification](IDLE-PLAY-DESIGN.md) records the current
state machine, random selection, exclusions, multiplayer and animation contracts.
The important priority is simple: work always wins. Play is a browser movement
and visual state, never a synthetic server working status.

The earlier three-toy experiment, two-pixel display changes and one-pixel body
lean were superseded by the full standing-play/toy revision. They are not the
current behavior, and source-art timelines alone do not establish live playback.

## Validation and limits

The latest production revision sealed 97 frontend files. Candidate and served-live
browser receipts bind to the same archive SHA-256:
`623f7f00a18a69932e38fc58d1b1f341260e80c5779444283de669930434ac06`.
The recorded deployment preserved the server CLI, protected runtime state and all
3,264 external asset files. Its 699 resolved catalog entries were unchanged by
this animation-only successor; it added runtime overlays, not replacement packs.

Evidence levels are deliberately separate:

- Final focused idle-play suite: **25 passing tests**; native directional art and
  toy-loop checks passed. The seven custom characters cover 224 directional slots.
- A matched broader webview run had **528/531** baseline and **533/536** candidate
  tests pass, with the same three failing assertions and no new failures. Those
  failures concern historical jungle width, Rebooto position and Foggy anchor
  expectations. The full suite was not all green and was not rerun after the last
  small art/anchor cleanup; focused/build/native/browser checks were rerun.
- All 11 toy approaches and 27 existing work/rest routes were reachable in the
  geometry check, including reserved-approach constraints.
- Candidate/live browser-local fixtures exercised approach and play interruption,
  return to the saved workstation, paired arrival/start and synchronous pair release,
  Rebooto's fixed placement, cleanup and narrow viewport visibility. Synthetic
  activity was delivered only to the local browser subscriber, never the server;
  outbound seat persistence was blocked.
- Empty-room comparison checked 97,280 pixels and corridor seams another 29,184,
  with zero mismatches. Toy-only masks separately established changing prop pixels
  instead of mistaking an agent's arm movement for a toy animation.
- These are retained exact-artifact results, not newly run tests of this Markdown
  commit, a real-provider inference demonstration, a complete fresh server/VSIX
  qualification, or a GitHub CI pass.

## Public distribution and future source integration

This write-up intentionally contains no credentials, personal runtime configuration,
private connection endpoints, raw activity logs or private asset-pack downloads.
Character references and third-party designs do not gain new redistribution rights
from being described here; upstream attribution and the existing license remain.

A future source synchronization must reconcile the complete production delta,
retain the public bridge's one-to-one policy, review asset redistribution separately,
and test the exact resulting public artifact. See the
[production source map](PRODUCTION-SOURCE-MAP.md). Do not install an old public
archive over a newer office merely because both report package version 1.6.0.
No npm, Marketplace, Open VSX or new binary release is part of this documentation
publication. Existing November 11 release downloads remain historical artifacts.
