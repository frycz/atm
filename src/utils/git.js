const { execSync } = require('child_process');

function exec(cmd, options = {}) {
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
    return result === null ? null : result.trim();
  } catch (err) {
    if (options.ignoreError) return null;
    throw err;
  }
}

function gitAdd() {
  exec('git add .');
}

function gitCommit(message) {
  exec(`git commit -m "${message.replace(/"/g, '\\"')}"`);
}

function gitPush() {
  exec('git push', { stdio: 'inherit' });
}

function gitInit() {
  exec('git init');
}

function gitAddRemote(url) {
  exec(`git remote add origin ${url}`);
}

function gitSetUpstream() {
  exec('git push -u origin main', { stdio: 'inherit' });
}

module.exports = {
  gitAdd,
  gitCommit,
  gitPush,
  gitInit,
  gitAddRemote,
  gitSetUpstream,
};
