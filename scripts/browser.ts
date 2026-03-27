import { chromium } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdirSync, existsSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { createServer, request as httpRequest, type IncomingMessage } from 'node:http';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const screenshotsDir = resolve(process.cwd(), 'screenshots');
const portFile = resolve(process.cwd(), '.browser-port');
const scriptDir = new URL('.', import.meta.url).pathname;
const repoId = createHash('md5').update(scriptDir).digest('hex').slice(0, 8);
const userDataDir = `/tmp/playwright-${repoId}`;

let context: BrowserContext | null = null;
let page: Page | null = null;

async function startServer() {
  console.log('🧹 Cleaning up stale browser processes...');

  if (existsSync(portFile)) {
    unlinkSync(portFile);
  }

  try {
    execSync(`pkill -f "playwright-${repoId}"`, { stdio: 'ignore' });
  } catch {
    // No processes to kill
  }

  try {
    execSync(`rm -rf "${userDataDir}"`, { stdio: 'ignore' });
  } catch {
    // Directory doesn't exist
  }

  context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: ['--start-maximized'],
    viewport: null
  });
  page = context.pages()[0] || await context.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
  });

  page.on('pageerror', err => {
    console.log('[BROWSER ERROR]', err.message);
  });

  const server = createServer(async (req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405);
      res.end();
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { command, args } = JSON.parse(body);
        const result = await executeCommand(command, args);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, result }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }));
      }
    });
  });

  server.listen(0, 'localhost', () => {
    const addr = server.address();
    if (addr && typeof addr === 'object') {
      writeFileSync(portFile, String(addr.port));
      console.log('✅ Browser server started on port', addr.port);
    }
  });

  process.on('SIGTERM', async () => {
    if (context) await context.close();
    if (existsSync(portFile)) unlinkSync(portFile);
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    if (context) await context.close();
    if (existsSync(portFile)) unlinkSync(portFile);
    process.exit(0);
  });
}

async function executeCommand(command: string, args: string[]): Promise<string> {
  if (!page) throw new Error('No page available');

  switch (command) {
    case 'navigate': {
      const url = args[0];
      if (!url) throw new Error('navigate requires a URL argument');
      console.log('🌐 Navigating to:', url);
      await page.goto(url);
      await page.waitForLoadState('load');
      return 'Navigation complete';
    }

    case 'click': {
      const selector = args[0];
      if (!selector) throw new Error('click requires a selector argument');
      console.log('👆 Clicking:', selector);
      await page.click(selector, { timeout: 30000 });
      return 'Click complete';
    }

    case 'fill': {
      const selector = args[0];
      const text = args[1];
      if (!selector) throw new Error('fill requires a selector argument');
      if (text === undefined) throw new Error('fill requires a text argument');
      console.log('✍️  Filling:', selector, 'with:', text);
      await page.fill(selector, text, { timeout: 30000 });
      return 'Fill complete';
    }

    case 'reload': {
      console.log('🔄 Reloading page');
      await page.reload();
      await page.waitForLoadState('load');
      return 'Reload complete';
    }

    case 'screenshot': {
      const viewportOnly = args.includes('--viewport');
      mkdirSync(screenshotsDir, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${timestamp}.png`;
      const screenshotPath = resolve(screenshotsDir, filename);

      await page.screenshot({ path: screenshotPath, fullPage: !viewportOnly });
      execSync(`sips -Z 1920 "${screenshotPath}"`);

      return `Screenshot saved: ${screenshotPath}`;
    }

    case 'eval': {
      const code = args[0];
      if (!code) throw new Error('eval requires a code argument');
      console.log('⚙️  Evaluating:', code);
      // biome-ignore lint/security/noGlobalEval: eval command is intentional for browser testing
      const result = await page.evaluate((c) => eval(c), code);
      return `Result: ${JSON.stringify(result)}`;
    }

    case 'verify': {
      const started = await page.evaluate(() => ((globalThis as any).document.getElementById('editor') as any)?.editor?.repl?.state?.started);
      if (started) {
        return 'Audio is playing';
      } else {
        throw new Error('Audio not playing');
      }
    }

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

async function sendCommand(command: string, args: string[]) {
  if (!existsSync(portFile)) {
    console.error('❌ Browser server not running. Run "start" first.');
    process.exit(1);
  }

  const port = parseInt(readFileSync(portFile, 'utf-8'), 10);

  return new Promise<void>((resolve, reject) => {
    const postData = JSON.stringify({ command, args });
    const req = httpRequest({
      hostname: 'localhost',
      port,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res: IncomingMessage) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const response = JSON.parse(data);
        if (response.success) {
          console.log('✅', response.result);
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function help() {
  console.log(`
📖 Browser Commands (state persists once browser is started):

  start                     - Start browser server (BLOCKS - requires run_in_background)
  navigate <url>            - Navigate to URL (30s timeout)
  reload                    - Reload current page
  click <selector>          - Click element (30s timeout)
  fill <selector> <text>    - Fill input field (30s timeout)
  screenshot [--viewport]       - Take screenshot (full page by default, viewport-only with --viewport flag)
  eval <code>               - Evaluate JavaScript in page
  verify                    - Check if audio is playing
  help                      - Show this help

Usage:
  - Run start in background with run_in_background flag
  - Kill the background task to close browser

Troubleshooting:
  - If click or navigate commands are timing out, you are most likely using the wrong selector
  - Explore the relevant code to determine the correct selector
  - For fill command: Quote selectors but avoid quoting text unless it contains spaces
  - Quoting text with special characters (like !) causes bash to escape them with backslashes
`);
}

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  if (!command) {
    console.error('Usage: bun scripts/browser.ts <command> [args]');
    console.log('Run "bun scripts/browser.ts help" for available commands');
    process.exit(1);
  }

  if (command === 'help') {
    help();
    return;
  }

  if (command === 'start') {
    await startServer();
    return;
  }

  await sendCommand(command, args);
}

main().catch(error => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
