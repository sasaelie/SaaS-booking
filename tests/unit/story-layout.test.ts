import { expect, it } from 'vitest';
import { StoryLayoutSchema } from '../../src/core/validation/story-layout';
it('only accepts bounded relative placement, preventing off-card content', () => {
  expect(
    StoryLayoutSchema.safeParse({ title: { x: 0, y: 25 }, price: { x: 100, y: 100 } }).success,
  ).toBe(true);
  expect(
    StoryLayoutSchema.safeParse({ title: { x: -1, y: 25 }, price: { x: 50, y: 100 } }).success,
  ).toBe(false);
  expect(
    StoryLayoutSchema.safeParse({ title: { x: 0, y: 101 }, price: { x: 50, y: 100 } }).success,
  ).toBe(false);
});
