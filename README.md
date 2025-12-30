# DJ Claude

Let Claude Code be your DJ. Claude edits Strudel patterns, validates them server-side, and the browser plays the music.

## How it works

```
Claude edits pattern.js
        ↓
POST /pattern (validates headlessly)
        ↓
Browser polls, plays valid patterns
```

Patterns are validated server-side using `@strudel/core` before the browser ever sees them. Invalid patterns return an error to Claude, valid ones play at the next cycle boundary. Music never stops due to a bad edit.

## Usage

Clone, start Claude Code in this directory, ask for tunes.

## Sounds

Includes drum samples, General MIDI instruments (piano, strings, brass, etc.), and synthesizers.

## License

AGPL-3.0 (required by @strudel/core dependency)
