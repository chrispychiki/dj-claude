let currentHash = null;
let editor = null;
let isPlaying = false;
let lastReportedCount = 0;

function reportSoundsIfChanged() {
  const sounds = Object.keys(soundMap.get());
  if (sounds.length > lastReportedCount) {
    lastReportedCount = sounds.length;
    fetch('/sounds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sounds }),
    });
    console.log(`Reported ${sounds.length} sounds to server`);
  }
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

function updatePlayPauseButton() {
  const btn = document.getElementById('play-pause');
  btn.textContent = isPlaying ? '❚❚' : '▶';
  btn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
}

async function applyPattern(code) {
  if (!editor?.editor) return false;
  try {
    const wrapped = `(${code}).scope()`;
    editor.editor.setCode(wrapped);
    if (isPlaying) {
      await editor.editor.evaluate();
    }
    return true;
  } catch (e) {
    console.error('Failed to apply pattern:', e);
    return false;
  }
}

async function poll() {
  // Report here because samples() doesn't await soundMap population,
  // and soundMap.subscribe()/listen() don't fire for dirt-samples loading
  reportSoundsIfChanged();
  const data = await fetchPattern();
  if (data && data.pattern && data.hash !== currentHash) {
    const success = await applyPattern(data.pattern);
    if (success) {
      currentHash = data.hash;
    }
  }
}

async function togglePlayPause() {
  if (!editor?.editor) return;

  if (isPlaying) {
    editor.editor.stop();
    isPlaying = false;
  } else {
    await initAudio();
    await editor.editor.evaluate();
    isPlaying = true;
  }
  updatePlayPauseButton();
}

async function init() {
  editor = document.getElementById('editor');
  const playPauseBtn = document.getElementById('play-pause');

  if (!playPauseBtn) {
    console.error('play-pause button not found');
    return;
  }

  playPauseBtn.addEventListener('click', togglePlayPause);

  await customElements.whenDefined('strudel-editor');

  // No await - samples() returns before soundMap is populated anyway
  samples('github:tidalcycles/dirt-samples');
  reportSoundsIfChanged();

  const data = await fetchPattern();
  if (data && data.pattern && editor.editor) {
    currentHash = data.hash;
    const wrapped = `(${data.pattern}).scope()`;
    editor.editor.setCode(wrapped);
  }

  // Block editing but allow scroll
  document.querySelector('.cm-content')?.addEventListener('mousedown', e => e.preventDefault(), true);

  setInterval(poll, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
