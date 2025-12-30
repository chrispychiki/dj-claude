import { test, expect, describe, beforeAll, afterAll, beforeEach } from 'bun:test';

const SERVER_URL = 'http://localhost:3001';
const PATTERN_FILE = './pattern.test.js';

let serverProc;

async function writePattern(code) {
  await Bun.write(PATTERN_FILE, code);
}

async function startServer() {
  serverProc = Bun.spawn(['bun', 'run', 'server.js'], {
    env: { ...process.env, PATTERN_FILE, PORT: '3001' },
    stdout: 'pipe',
    stderr: 'pipe',
  });
  // Wait for server to be ready
  await new Promise(r => setTimeout(r, 1000));
}

async function stopServer() {
  if (serverProc) {
    serverProc.kill();
    await serverProc.exited;
  }
  // Clean up test pattern file
  try {
    await Bun.write(PATTERN_FILE, '');
    const file = Bun.file(PATTERN_FILE);
    if (await file.exists()) {
      await Bun.$`rm ${PATTERN_FILE}`;
    }
  } catch {}
}

const TEST_SOUNDS = ['bd', 'sd', 'hh', 'cp', 'lt', 'mt', 'ht', 'arpy', 'bass', 'casio'];

async function registerSounds() {
  await fetch(`${SERVER_URL}/sounds`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sounds: TEST_SOUNDS }),
  });
}

describe('server', () => {
  beforeAll(async () => {
    await writePattern('s("bd sd")');
    await startServer();
    await registerSounds();
  });

  afterAll(async () => {
    await stopServer();
  });

  describe('GET /pattern', () => {
    test('returns current pattern', async () => {
      const res = await fetch(`${SERVER_URL}/pattern`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.pattern).toBeDefined();
      expect(data.hash).toBeDefined();
    });

    test('returns json content type', async () => {
      const res = await fetch(`${SERVER_URL}/pattern`);
      expect(res.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('POST /pattern', () => {
    beforeEach(async () => {
      await writePattern('s("bd sd")');
    });

    test('validates and accepts valid pattern', async () => {
      await writePattern('s("hh*4")');
      const res = await fetch(`${SERVER_URL}/pattern`, { method: 'POST' });
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.hash).toBeDefined();
      expect(data.eventCount).toBe(4);
    });

    test('rejects invalid syntax', async () => {
      await writePattern('s("bd sd"');
      const res = await fetch(`${SERVER_URL}/pattern`, { method: 'POST' });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBeDefined();
    });

    test('rejects unknown samples', async () => {
      await writePattern('s("fakesample")');
      const res = await fetch(`${SERVER_URL}/pattern`, { method: 'POST' });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.ok).toBe(false);
      expect(data.error).toContain('Unknown samples');
      expect(data.error).toContain('fakesample');
    });

    test('hash changes when pattern changes', async () => {
      await writePattern('s("bd")');
      const res1 = await fetch(`${SERVER_URL}/pattern`, { method: 'POST' });
      const data1 = await res1.json();

      await writePattern('s("sd")');
      const res2 = await fetch(`${SERVER_URL}/pattern`, { method: 'POST' });
      const data2 = await res2.json();

      expect(data1.hash).not.toBe(data2.hash);
    });

    test('GET returns updated pattern after POST', async () => {
      await writePattern('s("cp*8")');
      await fetch(`${SERVER_URL}/pattern`, { method: 'POST' });

      const res = await fetch(`${SERVER_URL}/pattern`);
      const data = await res.json();
      expect(data.pattern).toBe('s("cp*8")');
    });

    test('failed POST does not update current pattern', async () => {
      // Set a valid pattern first
      await writePattern('s("bd")');
      await fetch(`${SERVER_URL}/pattern`, { method: 'POST' });

      // Try to set an invalid pattern
      await writePattern('s("notreal")');
      await fetch(`${SERVER_URL}/pattern`, { method: 'POST' });

      // GET should still return the old valid pattern
      const res = await fetch(`${SERVER_URL}/pattern`);
      const data = await res.json();
      expect(data.pattern).toBe('s("bd")');
    });
  });

  describe('unknown routes', () => {
    test('returns 404 for unknown path', async () => {
      const res = await fetch(`${SERVER_URL}/unknown`);
      expect(res.status).toBe(404);
    });

    test('root path serves HTML', async () => {
      const res = await fetch(`${SERVER_URL}/`);
      expect(res.status).toBe(200);
    });
  });

  describe('HTTP methods', () => {
    test('PUT /pattern returns 404', async () => {
      const res = await fetch(`${SERVER_URL}/pattern`, { method: 'PUT' });
      expect(res.status).toBe(404);
    });

    test('DELETE /pattern returns 404', async () => {
      const res = await fetch(`${SERVER_URL}/pattern`, { method: 'DELETE' });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /sounds', () => {
    test('returns registered sounds', async () => {
      const res = await fetch(`${SERVER_URL}/sounds`);
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.sounds).toBeArray();
      expect(data.sounds).toContain('bd');
      expect(data.sounds).toContain('sd');
    });
  });

  describe('POST /sounds', () => {
    test('registers sounds', async () => {
      const res = await fetch(`${SERVER_URL}/sounds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sounds: ['test1', 'test2'] }),
      });
      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });
  });
});

describe('server without browser', () => {
  let proc;

  beforeAll(async () => {
    await Bun.write('./pattern.test2.js', 's("bd")');
    proc = Bun.spawn(['bun', 'run', 'server.js'], {
      env: { ...process.env, PATTERN_FILE: './pattern.test2.js', PORT: '3002' },
      stdout: 'pipe',
      stderr: 'pipe',
    });
    await new Promise(r => setTimeout(r, 1000));
  });

  afterAll(async () => {
    if (proc) {
      proc.kill();
      await proc.exited;
    }
    try { await Bun.$`rm ./pattern.test2.js`; } catch {}
  });

  test('POST /pattern returns 503 when browser not connected', async () => {
    const res = await fetch('http://localhost:3002/pattern', { method: 'POST' });
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error).toContain('Browser not connected');
  });
});
