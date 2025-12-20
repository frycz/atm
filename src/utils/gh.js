const { execSync } = require('child_process');

function exec(cmd, options = {}) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
    return result ? result.trim() : null;
  } catch (err) {
    if (options.ignoreError) return null;
    throw err;
  }
}

function isGhInstalled() {
  try {
    exec('gh --version');
    return true;
  } catch {
    return false;
  }
}

function isGhAuthenticated() {
  try {
    exec('gh auth status');
    return true;
  } catch {
    return false;
  }
}

function getGhUsername() {
  try {
    return exec('gh api user -q .login');
  } catch {
    return null;
  }
}

function createRepo(user, repo) {
  exec(`gh repo create ${user}/${repo} --private`, { stdio: 'inherit' });
}

function getRepoVisibility(owner, repo) {
  try {
    const result = exec(`gh repo view ${owner}/${repo} --json isPrivate -q .isPrivate`);
    if (result === 'true') return 'private';
    if (result === 'false') return 'public';
    return null;
  } catch {
    return null;
  }
}

module.exports = {
  isGhInstalled,
  isGhAuthenticated,
  getGhUsername,
  createRepo,
  getRepoVisibility,
};
