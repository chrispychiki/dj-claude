# DJ Claude

Turn [Claude Code](https://www.anthropic.com/claude-code) into a DJ. Claude edits [Strudel](https://strudel.cc) patterns, the server validates them, and the browser plays the music. This feedback loop is the core principle of this system design and allows you to jam indefinitely.

## Usage

Start Claude Code in this directory and ask for whatever you'd like. Enable auto-accept edits (<kbd>Shift</kbd>+<kbd>Tab</kbd>).

Example prompts:

- "Take the current pattern as a starting point and keep evolving it. Explore different directions sonically. Let each iteration breathe for a minute before changing."
- "I'd like some lofi beats to study to. Switch it up every minute or two."
- "Show me what you got."

### Tips

- To be clear, don't expect Claude to be an actually good DJ. I'd say about half of his compositions are passable music, and maybe half of that is enjoyable music.
- Be nice to your Claude! Keep your feedback high-level and open-ended and just let him cook. You'll eventually get a banger or two.
- You'll need to provide the actual notes, structure, or code if you want to recreate a specific song. Claude does not have a good intuition for replicating existing music in Strudel.
- However, you can specify instruments or styles (e.g. orchestral, jazzy piano, etc.). I'm no musician, but he seems to do a decent job with this sort of direction.
- You may want to modify the intro paragraph in `CLAUDE.md` to set your preferred vibe (restart Claude Code to apply changes).

### Other agents

Symlink `CLAUDE.md` to whatever your agent reads (e.g., `AGENTS.md` for Codex).

### Manual usage

Read `CLAUDE.md` and follow those steps yourself.

## Sounds

Includes drum samples from [Dirt](https://github.com/tidalcycles/Dirt-Samples) plus the default sounds from the [Strudel REPL](https://strudel.cc).

## License

AGPL-3.0 (required by @strudel/core dependency)

## Future work

Validation parity is fundamentally hard. Server-side validation uses `@strudel/transpiler` to parse and evaluate patterns and checks for unknown sounds, but some things only fail at the audio layer in a browser context. Gaps exist in both directions: patterns may pass validation but fail in browser, or fail validation but would have worked. Even when both server validation and browser evaluation pass, specific sounds or functions can fail silently during playback.

Known issues we've fixed through trial and error:
- Numeric sample names (808, 909) - mini-notation parser converts to numbers
- AudioWorklet initialization - effects like `crush()`, `coarse()`, `distort()` require `initAudio()` before evaluation

Confidence in full parity remains low. A more robust approach would move validation to the browser itself: evaluate the pattern, run one muted cycle, capture console errors, report back. This catches both evaluation errors and runtime errors in the same environment that plays the audio.

## Notes

All code written and tested by Claude. Forgive me for any slop you encounter.

Currently runs fine on my Mac mini. Not tested on any other devices/OSes.

This project is not affiliated with, endorsed by, or sponsored by Anthropic.
