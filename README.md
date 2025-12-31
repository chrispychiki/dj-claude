# DJ Claude

Turn Claude Code into a DJ. Claude edits [Strudel](https://strudel.cc) patterns, the server validates them, and the browser plays the music.

## How it works

```
Claude edits pattern.js
        ↓
POST /pattern (validates server-side)
        ↓
Browser polls, plays valid patterns
```

Patterns are validated using `@strudel/core` before the browser sees them. Invalid patterns return an error to Claude, valid ones play at the next poll interval. Music never stops due to a bad edit.

## Usage

Start Claude Code in this directory and ask for tunes.

## Manual usage

Read `CLAUDE.md` and follow those steps yourself.

## Other agents

Other coding agents use similar instruction files. Symlink `CLAUDE.md` to whatever your agent reads (e.g., `AGENTS.md` for Codex).

## Sounds

Includes drum samples from [Dirt](https://github.com/tidalcycles/Dirt-Samples) plus the default sounds from the [Strudel REPL](https://strudel.cc).

## License

AGPL-3.0 (required by @strudel/core dependency)
