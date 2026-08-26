const { configExists, findConfigDir, readConfig } = require("../utils/config.js");
const { gitAdd, gitCommit, gitPush } = require("../utils/git.js");

function save(message) {
  // Check if initialized (atm.json in this directory or any parent)
  if (!configExists()) {
    console.error('atm.json not found in this directory or any parent. Run "atm init" first.');
    process.exit(1);
  }

  // Run git from the project root so "atm s" saves everything, not just
  // the subdirectory it was invoked from
  const root = findConfigDir();
  if (root) {
    process.chdir(root);
  }

  // Use default commit message from config if not provided
  const config = readConfig();
  const commitMessage = message || config.defaultCommitMessage;

  if (!commitMessage) {
    console.error("No commit message specified.");
    process.exit(1);
  }

  try {
    gitAdd();
    gitCommit(commitMessage);
    gitPush();
  } catch (err) {
    if (err.stderr) {
      console.log(err.stderr);
    } else if (err.stdout) {
      console.log(err.stdout);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
}

module.exports = { save };
