import { describe, it, expect } from 'vitest';
import { calculateWarmupLadder } from '../src/execution-engines/warmup-ladder-engine.js';

describe('Warmup Ladder Engine', () => {
  it('calculates 3 staged warm-up sets accurately for 100kg working set', () => {
    const ladder = calculateWarmupLadder(100);
    expect(ladder.length).toBe(3);
    expect(ladder[0].weight_kg).toBe(50); // 50%
    expect(ladder[1].weight_kg).toBe(70); // 70%
    expect(ladder[2].weight_kg).toBe(90); // 90%
  });
});
