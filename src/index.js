const { help } = require("./commands/help.js");
const { init } = require("./commands/init.js");
const { save } = require("./commands/save.js");
const { showVersion } = require("./commands/version.js");

function run(args) {
  const cmd = args[0];

  // No args or help flag
  if (!cmd || cmd === "-h" || cmd === "--help") {
    help();
    return;
  }

  // Version flag
  if (cmd === "-v" || cmd === "--version") {
    showVersion();
    return;
  }

  // Init command
  if (cmd === "init") {
    init();
    return;
  }

  // Save shorthand
  if (cmd === "s") {
    save("save");
    return;
  }

  // Commit message must be wrapped in quotes (contains spaces or starts with quote)
  const isQuotedMessage =
    cmd.includes(" ") || cmd.startsWith('"') || cmd.startsWith("'");
  if (isQuotedMessage) {
    if (!cmd.trim()) {
      console.error("Commit message cannot be empty.");
      process.exit(1);
    }
    save(cmd);
    return;
  }

  // Unknown command
  console.error(`Unknown command: ${cmd}`);
  console.error('')
  console.error(`To use it as commit message, wrap it ith '' or ""`);
  console.error(`eg.: atm "${cmd}"`);
  console.error('')
  console.error(`Run 'atm --help' for usage.`);
  process.exit(1);
}

module.exports = { run };
