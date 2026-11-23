import { expect, it } from 'vitest';

import { createCharacter, getCharacterSprite } from '../src/office/engine/characters';
import { playEligible } from '../src/office/engine/idlePlay';
import { northPlayPose } from '../src/office/engine/northPlay';
import armFrames from '../src/office/northPlayData.json';
import play from '../src/office/playData.json';
import { getCharacterSprites } from '../src/office/sprites/spriteData';
import { CharacterState, Direction } from '../src/office/types';
const mitsuki = play.frames[play.characters.mitsuki.up[0]].map((row) =>
  Array.from(row, (c) => play.palette[c.charCodeAt(0) - 256]),
);
const approved = armFrames.map((frame) =>
  mitsuki.map((row, y) =>
    row.map((pixel, x) =>
      y >= 17 && y <= 24 && ((x >= 6 && x <= 9) || (x >= 15 && x <= 18)) ? frame[y][x] : pixel,
    ),
  ),
);
it('uses the exact owner-approved eight-slot Mitsuki motion with no trailing cuff pixels', () => {
  for (let frame = 0; frame < 8; frame++)
    expect(northPlayPose(mitsuki, frame, 'mitsuki')).toEqual(approved[frame]);
  expect(northPlayPose(mitsuki, 8, 'mitsuki')).toBe(northPlayPose(mitsuki, 0, 'mitsuki'));
});
it('keeps generic heads, feet and torso fixed, pads evenly and caches all hand poses', () => {
  const source = mitsuki.map((row) => row.slice(4, 20)),
    snapshot = JSON.stringify(source),
    frames = Array.from({ length: 8 }, (_, i) => northPlayPose(source, i));
  for (const im of frames) {
    expect(im.slice(0, 17)).toEqual(approved[0].slice(0, 17));
    expect(im.slice(25)).toEqual(approved[0].slice(25));
    for (let y = 17; y < 25; y++) expect(im[y].slice(10, 15)).toEqual(mitsuki[y].slice(10, 15));
  }
  expect(new Set(frames.map((f) => JSON.stringify(f))).size).toBeGreaterThanOrEqual(3);
  expect(JSON.stringify(source)).toBe(snapshot);
  expect(northPlayPose(source, 1)).toBe(frames[1]);
});
it('preserves fixed rooty tail pixels instead of treating them as lowered arms', () => {
  const source = mitsuki.map((row) => row.slice()),
    tail = 'tail-marker';
  source[23][18] = tail;
  for (let frame = 0; frame < 8; frame++)
    expect(northPlayPose(source, frame, 'rooty')[23][18]).toBe(tail);
});
it('routes named and generic north-facing play through hands, while TV stays seated and Rebooto stays excluded', () => {
  const ch = createCharacter(99990, 0, null, null);
  ch.agentName = 'Mitsuki Takasawa';
  ch.dir = Direction.UP;
  ch.state = CharacterState.PLAY;
  ch.isActive = false;
  ch.matrixEffect = null;
  for (let frame = 0; frame < 8; frame++) {
    ch.frame = frame;
    expect(getCharacterSprite(ch, getCharacterSprites(0, 0))).toEqual(approved[frame]);
  }
  ch.playTv = { x: 0, y: 0, width: 10, depth: 0, tint: 0, hueRemaining: 4 };
  expect(getCharacterSprite(ch, getCharacterSprites(0, 0))).toEqual(
    getCharacterSprites(0, 0).seated[Direction.UP],
  );
  ch.agentName = 'Rebooto McClickens';
  expect(playEligible(ch)).toBe(false);
});
it('never translates an unsupported future canvas into a head bob', () => {
  const source = [['opaque']];
  expect(northPlayPose(source, 1)).toBe(source);
});
