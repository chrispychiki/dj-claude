import { evalScope } from '@strudel/core';
import { evaluate } from '@strudel/transpiler';
import { webaudioRepl, samples, registerSynthSounds } from '@strudel/webaudio';
import { registerSoundfonts } from '@strudel/soundfonts';

let currentHash = null;

async function loadSounds() {
  await evalScope(
    import('@strudel/core'),
    import('@strudel/mini'),
    import('@strudel/webaudio'),
    import('@strudel/draw'),
    import('@strudel/soundfonts'),
  );
  registerSoundfonts();
  registerSynthSounds();
  await samples('github:tidalcycles/dirt-samples');

  const { soundMap } = await import('superdough');
  const sounds = Object.keys(soundMap.get());
  await fetch('/sounds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sounds }),
  });
}

async function init() {
  window.repl = webaudioRepl();
}

async function fetchPattern() {
  try {
    const res = await fetch('/pattern');
    const data = await res.json();
    return data;
  } catch (e) {
    console.error('Failed to fetch pattern:', e);
    return null;
  }
}

async function applyPattern(code) {
  try {
    const wrapped = `(${code}).scope()`;
    const { pattern } = await evaluate(wrapped);
    await window.repl.scheduler.setPattern(pattern, true);
    return true;
  } catch (e) {
    console.error('Failed to apply pattern:', e);
    return false;
  }
}

async function poll() {
  const data = await fetchPattern();
  if (data && data.pattern && data.hash !== currentHash) {
    const success = await applyPattern(data.pattern);
    if (success) {
      currentHash = data.hash;
      document.getElementById('status').textContent = `Pattern: ${data.hash}`;
    }
  }
}

loadSounds();

document.getElementById('start').addEventListener('click', async () => {
  document.getElementById('start').disabled = true;
  document.getElementById('status').textContent = 'Starting...';

  await init();

  const data = await fetchPattern();
  if (data && data.pattern) {
    await applyPattern(data.pattern);
    currentHash = data.hash;
    document.getElementById('status').textContent = `Pattern: ${data.hash}`;
  }

  setInterval(poll, 500);
});
