import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { validate, setBrowserSounds } from './validator.js';

const TEST_SOUNDS = ['bd', 'sd', 'hh', 'cp', 'lt', 'mt', 'ht', 'arpy', 'bass', 'casio'];

describe('validator', () => {
  beforeAll(() => {
    setBrowserSounds(TEST_SOUNDS);
  });
  describe('valid patterns', () => {
    test('simple pattern', async () => {
      const result = await validate('s("bd sd")');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(2);
    });

    test('pattern with repetition', async () => {
      const result = await validate('s("bd*4")');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(4);
    });

    test('pattern with slow', async () => {
      const result = await validate('s("bd sd").slow(2)');
      expect(result.valid).toBe(true);
    });

    test('pattern with fast', async () => {
      const result = await validate('s("bd sd").fast(2)');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(4);
    });

    test('pattern with grouping', async () => {
      const result = await validate('s("[bd sd] hh")');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(3);
    });

    test('pattern with alternation', async () => {
      const result = await validate('s("bd <sd cp>")');
      expect(result.valid).toBe(true);
    });

    test('stacked patterns', async () => {
      const result = await validate('stack(s("bd sd"), s("hh*4"))');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(6);
    });

    test('pattern with rest', async () => {
      const result = await validate('s("bd ~ sd ~")');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(2);
    });

    test('pattern with sample index', async () => {
      const result = await validate('s("bd:0 bd:1 bd:2")');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(3);
    });

    test('pattern with gain', async () => {
      const result = await validate('s("bd sd").gain(0.5)');
      expect(result.valid).toBe(true);
    });

    test('various valid samples', async () => {
      const samples = ['bd', 'sd', 'hh', 'cp', 'lt', 'mt', 'ht', 'arpy', 'bass', 'casio'];
      for (const sample of samples) {
        const result = await validate(`s("${sample}")`);
        expect(result.valid).toBe(true);
        expect(result.eventCount).toBeGreaterThan(0);
      }
    });

    test('empty mini notation produces no events but is valid', async () => {
      const result = await validate('s("~")');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(0);
    });
  });

  describe('invalid patterns - syntax errors', () => {
    test('unclosed parenthesis', async () => {
      const result = await validate('s("bd sd"');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('unclosed string', async () => {
      const result = await validate('s("bd sd)');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('invalid javascript', async () => {
      const result = await validate('this is not valid js');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('undefined function', async () => {
      const result = await validate('notAFunction("bd")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not defined');
    });

    test('undefined method', async () => {
      const result = await validate('s("bd").notAMethod()');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not a function');
    });
  });

  describe('invalid patterns - unknown samples', () => {
    test('single unknown sample', async () => {
      const result = await validate('s("fakesample")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown samples');
      expect(result.error).toContain('fakesample');
    });

    test('multiple unknown samples', async () => {
      const result = await validate('s("fake1 fake2 fake3")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('fake1');
      expect(result.error).toContain('fake2');
      expect(result.error).toContain('fake3');
    });

    test('mix of valid and unknown samples', async () => {
      const result = await validate('s("bd fakesample sd")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('fakesample');
      expect(result.error).not.toContain('bd');
      expect(result.error).not.toContain(' sd');
    });

    test('unknown sample in stack', async () => {
      const result = await validate('stack(s("bd"), s("notreal"))');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('notreal');
    });

    test('typo in common sample name', async () => {
      const result = await validate('s("bdd")'); // typo for bd
      expect(result.valid).toBe(false);
      expect(result.error).toContain('bdd');
    });
  });

  describe('numeric sound filtering', () => {
    afterAll(() => {
      setBrowserSounds(TEST_SOUNDS);
    });

    test('numeric-only sounds are filtered and rejected', async () => {
      setBrowserSounds(['bd', 'sd', '808', '909', '808bd']);
      const result = await validate('s("808")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('808');
    });

    test('sounds starting with numbers but not purely numeric work', async () => {
      setBrowserSounds(['bd', 'sd', '808', '909', '808bd']);
      const result = await validate('s("808bd")');
      expect(result.valid).toBe(true);
    });
  });

  describe('bank-based sounds', () => {
    afterAll(() => {
      setBrowserSounds(TEST_SOUNDS);
    });

    test('valid bank_sample combination', async () => {
      setBrowserSounds(['bd', 'sd', 'mybank_kick', 'mybank_snare']);
      const result = await validate('s("kick snare").bank("mybank")');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(2);
    });

    test('invalid bank_sample combination', async () => {
      setBrowserSounds(['bd', 'sd', 'mybank_kick']);
      const result = await validate('s("kick snare").bank("mybank")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mybank_snare');
    });

    test('mix of banked and non-banked sounds', async () => {
      setBrowserSounds(['bd', 'sd', 'mybank_kick']);
      const result = await validate('stack(s("bd sd"), s("kick").bank("mybank"))');
      expect(result.valid).toBe(true);
    });

    test('unknown bank with valid sample name', async () => {
      setBrowserSounds(['bd', 'sd', 'kick']);
      const result = await validate('s("kick").bank("unknownbank")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unknownbank_kick');
    });
  });

  describe('edge cases', () => {
    test('empty string pattern is parse error', async () => {
      const result = await validate('s("")');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('parse error');
    });

    test('whitespace in pattern', async () => {
      const result = await validate('s("  bd   sd  ")');
      expect(result.valid).toBe(true);
    });

    test('very long pattern', async () => {
      const result = await validate('s("bd sd hh cp bd sd hh cp bd sd hh cp bd sd hh cp")');
      expect(result.valid).toBe(true);
      expect(result.eventCount).toBe(16);
    });

    test('deeply nested pattern', async () => {
      const result = await validate('s("[[[bd sd] hh] cp]")');
      expect(result.valid).toBe(true);
    });

    test('pattern with numbers', async () => {
      const result = await validate('s("bd*4").fast(2).slow(0.5)');
      expect(result.valid).toBe(true);
    });

    test('multiline pattern', async () => {
      const result = await validate(`
        stack(
          s("bd sd"),
          s("hh*4")
        )
      `);
      expect(result.valid).toBe(true);
    });
  });
});
