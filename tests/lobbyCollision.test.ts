import { expect, it } from 'vitest';
import { marketWalkable } from '../src/buburMarket.ts';
import { sweepGround, walkGroundTowards } from '../src/sim/GroundCollision.ts';

it('crosses empty parking lanes while keeping actual cars and scooters solid', () => {
  for (const side of [-1, 1]) {
    const crossing = sweepGround({ x: side * 5.2, z: 4.95 }, { x: side * 12, z: 4.95 }, [], marketWalkable);
    expect(crossing).toMatchObject({ hit: false, z: 4.95 });
    expect(crossing.x).toBeCloseTo(side * 12);
    expect(marketWalkable(side * 10, -.25)).toBe(false);
    expect(marketWalkable(side * 7, -1.55)).toBe(false);
    expect(marketWalkable(side * 8.15, .8)).toBe(true);
  }
  expect(marketWalkable(24, 8)).toBe(true);
  expect(marketWalkable(29, 0)).toBe(false);
});

it('uses the doors and open floor in all three shops', () => {
  for (const x of [16.5, -16.5, -26]) {
    const walk = sweepGround({ x, z: -1.9 }, { x, z: -5.2 }, [], marketWalkable);
    expect(walk.hit).toBe(false);
    expect(walk.z).toBeCloseTo(-5.2);
  }
  expect(marketWalkable(14.05, -6.55)).toBe(false);
  expect(marketWalkable(-26, -6.02)).toBe(false);
});

it('stops opposing bodies and lets a scripted walker pass with room at the side', () => {
  let first = { x: -1, z: 0 }, second = { x: 1, z: 0 };
  for (let i = 0; i < 30; i++) {
    first = walkGroundTowards(first, { x: 2, z: 0 }, .1, [second], undefined, undefined, false);
    second = walkGroundTowards(second, { x: -2, z: 0 }, .1, [first], undefined, undefined, false);
    expect(second.x - first.x).toBeGreaterThanOrEqual(.64 - 1e-7);
  }
  expect(second.x - first.x).toBeLessThan(.76);
  const standing = { x: 0, z: 0 };
  let walker = { x: -1, z: 0 };
  for (let i = 0; i < 120; i++) {
    walker = walkGroundTowards(walker, { x: 2, z: 0 }, .08, [standing]);
    expect(Math.hypot(walker.x, walker.z)).toBeGreaterThanOrEqual(.64 - 1e-7);
  }
  expect(walker.x).toBeGreaterThan(1.9);
});
