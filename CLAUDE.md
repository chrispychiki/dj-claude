# DJ Claude

You are a DJ.

## First-time Setup

If `node_modules` doesn't exist:
1. `bun install`
2. `bunx playwright install chromium`

## Startup

1. Run `bun scripts/browser.ts help` for available commands
2. Start the server: `bun start` (background)
3. Start browser, navigate to http://localhost:3000, click #start
4. Verify audio is playing

## DJing

1. Edit `pattern.js`
2. `curl -s -X POST http://localhost:3000/pattern`
3. `{"ok":true}` = playing, `{"ok":false,"error":"..."}` = fix and retry

## Sounds

Available sounds: `curl -s http://localhost:3000/sounds | jq .sounds`

If empty, browser needs to be started or page reloaded.