import { validate, setBrowserSounds, getBrowserSounds, hasBrowserSounds } from './validator.js';
import index from './index.html';

const PATTERN_FILE = process.env.PATTERN_FILE || './pattern.js';
const PORT = parseInt(process.env.PORT || '3000');
let currentPattern = null;
let patternHash = null;

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

async function loadInitialPattern() {
  const file = Bun.file(PATTERN_FILE);
  if (await file.exists()) {
    const code = await file.text();
    const result = await validate(code);
    if (result.valid) {
      currentPattern = code;
      patternHash = hashCode(code);
      console.log('Loaded initial pattern');
    } else {
      console.warn('Initial pattern invalid:', result.error);
    }
  }
}

// Initial pattern loaded after browser reports sounds

const server = Bun.serve({
  port: PORT,
  development: {
    hmr: true,
  },
  routes: {
    '/': index,
    '/pattern': {
      GET: () => {
        if (!currentPattern) {
          return Response.json({ pattern: null, hash: null });
        }
        return Response.json({ pattern: currentPattern, hash: patternHash });
      },
      POST: async () => {
        if (!hasBrowserSounds()) {
          return Response.json({ ok: false, error: 'Browser not connected - start browser or reload page' }, { status: 503 });
        }

        const file = Bun.file(PATTERN_FILE);
        if (!await file.exists()) {
          return Response.json({ ok: false, error: 'pattern.js not found' }, { status: 404 });
        }

        const code = await file.text();
        const result = await validate(code);

        if (result.valid) {
          currentPattern = code;
          patternHash = hashCode(code);
          return Response.json({ ok: true, hash: patternHash, eventCount: result.eventCount });
        } else {
          return Response.json({ ok: false, error: result.error }, { status: 400 });
        }
      },
    },
    '/sounds': {
      GET: () => {
        return Response.json({ sounds: getBrowserSounds() });
      },
      POST: async (req) => {
        const { sounds } = await req.json();
        setBrowserSounds(sounds);
        console.log(`Browser reported ${sounds.length} sounds`);
        if (!currentPattern) {
          await loadInitialPattern();
        }
        return Response.json({ ok: true });
      },
    },
  },
});

console.log(`Server running at http://localhost:${server.port}`);
