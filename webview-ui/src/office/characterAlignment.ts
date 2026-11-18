import { CHARACTER_SITTING_OFFSET_PX } from '../constants.js';
import { jungleIdentity, jungleOffset } from './jungleRuntime.js';
import { LIBRARY_WORK_SEAT, MITSUKI_WORK_SEAT, usesMitsukiWorkspot } from './libraryRuntime.js';
import { serviceIdentity } from './serviceRuntime.js';
import { getCharacterSprites } from './sprites/spriteData.js';
import type { Character } from './types.js';
import { CharacterState } from './types.js';

/** One anchor policy for rendered sprites, labels, and pointer picking. */
export function characterSittingOffset(ch: Character): number {
  if (ch.state === CharacterState.PLAY && ch.playVisualOffset) return ch.playVisualOffset.y;
  const jungle = jungleOffset(ch);
  if (jungle) return jungle.y;
  if (jungleIdentity(ch) || serviceIdentity(ch)) return 0;
  if (
    usesMitsukiWorkspot(ch) &&
    ch.seatId === MITSUKI_WORK_SEAT &&
    ch.state === CharacterState.TYPE
  )
    return (
      (getCharacterSprites(ch.palette, ch.repeat).standingCasting
        ? 0
        : CHARACTER_SITTING_OFFSET_PX) - 10
    );
  if (ch.seatId === LIBRARY_WORK_SEAT && ch.state === CharacterState.TYPE) return -3;
  return ch.state === CharacterState.TYPE &&
    !getCharacterSprites(ch.palette, ch.repeat).standingCasting
    ? CHARACTER_SITTING_OFFSET_PX
    : 0;
}

/** Compact-office chair is centered half a tile west of its pathfinding tile.
 * Keep the stable assignment and navigation coordinates; offset only seated art.
 * Remove this scoped bridge when catalog-backed seat visual anchors are supported.
 */
export function characterSittingOffsetX(ch: Character): number {
  if (ch.state === CharacterState.PLAY && ch.playVisualOffset) return ch.playVisualOffset.x;
  const jungle = jungleOffset(ch);
  if (jungle) return jungle.x;
  if (jungleIdentity(ch) || serviceIdentity(ch)) return 0;
  if (ch.seatId === LIBRARY_WORK_SEAT && ch.state === CharacterState.TYPE) return -8;
  // Dining assembly moved eight native pixels west; retain stable navigation cells.
  if (
    ch.seatId?.startsWith('break28-seat-dining-') &&
    ch.state === CharacterState.TYPE &&
    !getCharacterSprites(ch.palette, ch.repeat).standingCasting
  )
    return -8;
  return ch.seatId === 'f-1784917100003-z4q4' &&
    ch.state === CharacterState.TYPE &&
    !getCharacterSprites(ch.palette, ch.repeat).standingCasting
    ? -8
    : 0;
}
