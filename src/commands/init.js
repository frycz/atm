const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { configExists, writeConfig } = require("../utils/config.js");
const {
  isGhInstalled,
  isGhAuthenticated,
  getGhUsername,
  createRepo,
} = require("../utils/gh.js");
const {
  gitInit,
  gitAddRemote,
  gitSetUpstream,
  gitAdd,
  gitCommit,
} = require("../utils/git.js");

function prompt(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function init() {
  // Check if already initialized
  if (configExists()) {
    console.error("atm.json already exists. Already initialized.");
    process.exit(1);
  }

  // Check gh CLI
  if (!isGhInstalled()) {
    console.error("gh CLI is not installed.");
    console.error("Install it from: https://cli.github.com/");
    process.exit(1);
  }

  // Check gh auth
  if (!isGhAuthenticated()) {
    console.error("gh CLI is not authenticated.");
    console.error("Run: gh auth login");
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Get username
    const detectedUsername = getGhUsername();
    let username;
    if (detectedUsername) {
      const confirm = await prompt(
        rl,
        `GitHub username [${detectedUsername}]: `
      );
      username = confirm || detectedUsername;
    } else {
      username = await prompt(rl, "GitHub username: ");
      if (!username) {
        console.error("Username is required.");
        process.exit(1);
      }
    }

    // Get repo name
    const repoName = await prompt(rl, "Repository name: ");
    if (!repoName) {
      console.error("Repository name is required.");
      process.exit(1);
    }

    // Get directory
    const defaultDir = `./${repoName}`;
    const dirInput = await prompt(rl, `Directory [${defaultDir}]: `);
    const dir = dirInput || defaultDir;

    rl.close();

    // Create the repo on GitHub
    console.log(`\nCreating private repo ${username}/${repoName}...`);
    createRepo(username, repoName);

    // Create directory
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    // Change to directory
    process.chdir(fullPath);

    // Initialize git
    console.log("Initializing git...");
    gitInit();

    // Create README
    fs.writeFileSync("README.md", `# ${repoName}\n`);

    // Write config
    writeConfig({
      defaultCommitMessage: "save",
    });

    // Initial commit
    gitAdd();
    gitCommit("initial commit");

    // Add remote and push
    const remoteUrl = `https://github.com/${username}/${repoName}.git`;
    gitAddRemote(remoteUrl);
    console.log("Pushing to GitHub...");
    gitSetUpstream();

    console.log(`\nDone! Repository created at ${fullPath}`);
    console.log(`\nNext steps:
      1. Go to ${fullPath}
      2. Make changes
      3. Run 'atm s' to push the changes to GitHub`);
  } catch (err) {
    rl.close();
    console.error("Error:", err.message);
    process.exit(1);
  }
}

module.exports = { init };
