import { evaluate } from '@strudel/transpiler';
import { evalScope } from '@strudel/core';

let initialized = false;
let browserSounds = new Set();

export function setBrowserSounds(sounds) {
  browserSounds = new Set(sounds);
  console.log(`Validator updated with ${browserSounds.size} browser sounds`);
}

export function getBrowserSounds() {
  return [...browserSounds];
}

async function init() {
  if (initialized) return;
  await evalScope(
    import('@strudel/core'),
    import('@strudel/mini'),
  );
  initialized = true;
}

function isValidSound(s) {
  return browserSounds.has(s);
}

export function hasBrowserSounds() {
  return browserSounds.size > 0;
}

export async function validate(code) {
  await init();
  try {
    const { pattern } = await evaluate(code);
    const events = pattern.queryArc(0, 1);

    const unknown = new Set();
    for (const event of events) {
      const s = event.value?.s;
      if (s && !isValidSound(s)) {
        unknown.add(s);
      }
    }

    if (unknown.size > 0) {
      return { valid: false, error: `Unknown samples: ${[...unknown].join(', ')}` };
    }

    return { valid: true, eventCount: events.length };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
