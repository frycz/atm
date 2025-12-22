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

  // Save command: "atm s" or "atm s [message]"
  if (cmd === "s") {
    const messageArgs = args.slice(1);
    if (messageArgs.length > 0) {
      const message = messageArgs.join(" ");
      if (!message.trim()) {
        console.error("Commit message cannot be empty.");
        process.exit(1);
      }
      save(message);
    } else {
      save(); // Use default message from config
    }
    return;
  }

  // Unknown command
  console.error(`Unknown command: ${cmd}`);
  console.error("");
  console.error(`To save with a custom commit message, use: atm s ${cmd}`);
  console.error("");
  console.error(`Run 'atm --help' for usage.`);
  process.exit(1);
}

module.exports = { run };
