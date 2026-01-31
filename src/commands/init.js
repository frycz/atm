const readline = require("readline");
const fs = require("fs");
const path = require("path");
const { configExists, writeConfig } = require("../utils/config.js");
const {
  isGhInstalled,
  isGhAuthenticated,
  getGhUsername,
  createRepo,
  getRepoVisibility,
} = require("../utils/gh.js");
const {
  gitInit,
  gitAddRemote,
  gitSetUpstream,
  gitAdd,
  gitCommit,
  isGitRepo,
  getRemoteUrl,
  parseRemoteUrl,
} = require("../utils/git.js");

function prompt(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function handleExistingRepo() {
  const cwd = process.cwd();
  console.log(`\nGit repository detected in: ${cwd}`);

  // Get remote info
  const remoteUrl = getRemoteUrl();
  const repoInfo = parseRemoteUrl(remoteUrl);

  if (remoteUrl) {
    console.log(`\nRemote URL: ${remoteUrl}`);

    if (repoInfo) {
      // Check if non-GitHub remote
      if (repoInfo.hostType !== "github") {
        console.error(`\nError: atm only works with GitHub repositories.`);
        console.error(`Detected host: ${repoInfo.hostType}`);
        process.exit(1);
      }

      console.log(`Host: ${repoInfo.hostType}`);

      // Check visibility for GitHub repos
      if (isGhInstalled() && isGhAuthenticated()) {
        const visibility = getRepoVisibility(repoInfo.owner, repoInfo.repo);
        if (visibility) {
          console.log(`Visibility: ${visibility}`);
        }
      }
    }
  } else {
    console.log("\nNo remote configured.");
  }

  console.log("\nThis will only create an atm.json file. No new repository will be created.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const answer = await prompt(rl, "\nCreate atm.json in this directory? [y/N]: ");
    rl.close();

    if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
      writeConfig({
        defaultCommitMessage: "save",
      });
      console.log("\natm.json created successfully.");
      console.log("You can now use 'atm s' to save and push changes.");
    } else {
      console.log("\nAborted. No changes made.");
    }
  } catch (err) {
    rl.close();
    console.error("Error:", err.message);
    process.exit(1);
  }
}

function expandTilde(filePath) {
  if (filePath.startsWith("~/")) {
    return path.join(process.env.HOME || process.env.USERPROFILE, filePath.slice(2));
  }
  if (filePath === "~") {
    return process.env.HOME || process.env.USERPROFILE;
  }
  return filePath;
}

async function init(targetPath) {
  let dir = null;
  let defaultRepoName = null;

  // If targetPath is provided, set up the directory first
  if (targetPath) {
    const expandedPath = expandTilde(targetPath);
    const fullPath = path.resolve(expandedPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    // Change to the target directory
    process.chdir(fullPath);
    dir = fullPath;
    defaultRepoName = path.basename(fullPath);
  }

  // Check if already initialized
  if (configExists()) {
    console.error("atm.json already exists. Already initialized.");
    process.exit(1);
  }

  // Check if we're in an existing git repo
  if (isGitRepo()) {
    await handleExistingRepo();
    return;
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
    let repoName;
    if (defaultRepoName) {
      const repoInput = await prompt(rl, `Repository name [${defaultRepoName}]: `);
      repoName = repoInput || defaultRepoName;
    } else {
      repoName = await prompt(rl, "Repository name: ");
      if (!repoName) {
        console.error("Repository name is required.");
        process.exit(1);
      }
    }

    // Get directory (only if not already specified via targetPath)
    if (!dir) {
      const defaultDir = path.join('.', repoName);
      const dirInput = await prompt(rl, `Directory [${defaultDir}]: `);
      dir = dirInput || defaultDir;
    }

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
