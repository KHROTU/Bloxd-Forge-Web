# Code API

You can run javascript when right clicking code blocks and press to code boards.
This is only available to owners of worlds lobbies.
The javascript can interact with the Bloxd.io game api.

Please use [our discord](https://discord.gg/vwMp5y25RX) to report any issues you come across or features you'd like to see added.

## Code Blocks

- World owners can find these by searching in the creative menu
- No need to add `press to code`, this text is only needed for code boards, and will automatically be removed
- If you want to run code without opening the code editor, you can trigger the code block by right clicking an adjacent `press to code` board instead

## Boards

- You can begin a board with `press to code` to run javascript when you right click it.
- Normally you can't edit a code board after placing it, but you can currently work around this by putting a space before `press to code`.
- Boards only allow for a small amount of text, we recommend you use Code Blocks instead, or you can work around this by using multiple boards

## Notes

- Global variable `myId` stores the player ID of who is running the code.
- Global variable `thisPos` stores the position of the currently executing code block or press to code board.
- You can use `api.log` or `console.log` for printing and debugging (they do the same thing).
- You can use `Date.now()` instead of `api.now()` if you prefer, both return the time in milliseconds.
- Comments like `/* comment */` work, but comments like `// comment` don't work right now.

